namespace TollFeeCalculator;

public static class DayFeeCalculator
{
    // This replicates the old logic where the first half hour between 9 and 15 is toll free and the last half hour costs 8.
    // It sounds wrong but since I don't know the exact requirements I will have to assume that's how it should work. 
    // If it should be 8 during that period replace the list with this instead:
    /*
        new(new (6, 0), new(6, 29), 8),
        new(new (6, 30), new(6, 59), 13),
        new(new (7, 0), new(7, 59), 18),
        new(new (8, 0), new(8, 29), 13),
        new(new (8, 30), new(14, 59), 8),
        new(new (15, 0), new(15, 29), 13),
        new(new (15, 30), new(16, 59), 18),
        new(new (17, 0), new(17, 59), 13),
        new(new (18, 0), new(18, 29), 8)
    */

    private static readonly IEnumerable<PeriodFee> Periods = [
        new(new (6, 0), new(6, 29), 8),
        new(new (6, 30), new(6, 59), 13),
        new(new (7, 0), new(7, 59), 18),
        new(new (8, 0), new(8, 29), 13),
        new(new (8, 30), new(8, 59), 8),
        new(new (9, 30), new(9, 59), 8),
        new(new (10, 30), new(10, 59), 8),
        new(new (11, 30), new(11, 59), 8),
        new(new (12, 30), new(12, 59), 8),
        new(new (13, 30), new(13, 59), 8),
        new(new (14, 30), new(14, 59), 8),
        new(new (15, 0), new(15, 29), 13),
        new(new (15, 30), new(16, 59), 18),
        new(new (17, 0), new(17, 59), 13),
        new(new (18, 0), new(18, 29), 8)
    ];

    public static int GetFee(DateTime date)
    {
        return Periods.FirstOrDefault(period => period.InPeriod(date))?.Fee ?? 0;
    }
}