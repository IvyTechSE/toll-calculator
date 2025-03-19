using TollFeeCalculator;

namespace TollCalculatorTest;

public class TollCalculatorTest
{
    [Fact]
    public void GetTollFee_ForSinglePassage_ReturnsCorrectFee()
    {
        /*
        6:00 - 6:29 8
        6:30 - 6:59 13
        7:00 - 7:59 18
        8:00 - 8:29 13
        8:30 - 8:59 8
        9:00 - 9:29 0
        9:30 - 9:59 8
        10:00 - 10:29 0
        10:30 - 10:59 8
        11:00 - 11:29 0
        11:30 - 11:59 8
        12:00 - 12:29 0
        12:30 - 12:59 8
        13:00 - 13:29 0
        13:30 - 13:59 8
        14:00 - 14:29 0
        14:30 - 14:59 8
        15:00 - 15:29 13
        15:29 - 16:59 18
        17:00 - 17:59 13
        18:00 - 18:29 8
        */

        // Wednesday
        Assert.Equal(8, GetFee("2025-03-18 6:02"));
        Assert.Equal(13, GetFee("2025-03-18 6:32"));
        Assert.Equal(18, GetFee("2025-03-18 7:02"));
        Assert.Equal(13, GetFee("2025-03-18 8:02"));
        Assert.Equal(8, GetFee("2025-03-18 8:32"));
        Assert.Equal(0, GetFee("2025-03-18 9:02"));
        Assert.Equal(8, GetFee("2025-03-18 9:32"));
        Assert.Equal(0, GetFee("2025-03-18 10:02"));
        Assert.Equal(13, GetFee("2025-03-18 15:02"));
        Assert.Equal(18, GetFee("2025-03-18 16:02"));
        Assert.Equal(13, GetFee("2025-03-18 17:02"));
        Assert.Equal(8, GetFee("2025-03-18 18:02"));
        Assert.Equal(0, GetFee("2025-03-18 18:32"));

        // Weekend
        Assert.Equal(0, GetFee("2025-03-22 7:32"));
        Assert.Equal(0, GetFee("2025-03-23 7:32"));

        // Holidays
        Assert.Equal(0, GetFee("2025-04-18 7:32"));
        Assert.Equal(0, GetFee("2025-05-01 7:32"));
        Assert.Equal(0, GetFee("2025-12-24 7:32"));

        // Toll-free vehicle
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Motorbike()));
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Tractor()));
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Diplomat()));
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Foreign()));
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Emergency()));
        Assert.Equal(0, GetFee("2025-03-18 7:02", new Military()));
    }

    [Fact]
    public void GetTollFee_ForMultiplePassages_LimitsAt60PerDay()
    {
        var day = new DateOnly(2025, 3, 19);
        DateTime[] passages = [
            new(day, new(6, 32)),  //13
            new(day, new(7, 33)),  //18
            new(day, new(8, 34)),  //8
            new(day, new(13, 30)), //8
            new(day, new(15, 0)),  //13
            new(day, new(16, 1)),  //18
            new(day, new(17, 2)),  //13
            new(day, new(18, 3))   //8
        ];

        var fee = GetFee(passages);

        // 13 + 18 + 8 + 8 + 13 + 18 + 13 + 8 = 99
        Assert.Equal(60, fee);
    }

    [Fact]
    public void GetTollFee_ForMultiplePassages_ChargesOncePerHour()
    {
        var day = new DateOnly(2025, 3, 19);
        DateTime[] passages = [
            new(day, new(6, 32)),  //13
            new(day, new(7, 2)),   //18
            new(day, new(8, 1)),   //13
            new(day, new(8, 31)),  //8
            new(day, new(17, 31)), //13
            new(day, new(18, 1))   //8
        ];

        var fee = GetFee(passages);

        // 18 + 8 + 13 = 39
        Assert.Equal(39, fee);
    }

    [Fact]
    public void GetTollFee_ForMultiplePassages_HandlesNoPassages()
    {
        DateTime[] passages = [];

        var fee = GetFee(passages);

        Assert.Equal(0, fee);
    }

    private static int GetFee(DateTime[] passages)
    {
        return TollCalculator.GetTollFee(new Car(), passages);
    }

    private static int GetFee(string dateString)
    {
        return GetFee(dateString, new Car());
    }

    private static int GetFee(string dateString, IVehicle vehicle)
    {
        return TollCalculator.GetTollFee(DateTime.Parse(dateString), vehicle);
    }
}
