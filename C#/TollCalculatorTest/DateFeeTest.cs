using TollFeeCalculator;

namespace TollCalculatorTest;

public class DateFeeTest
{
    [Fact]
    public void SameHour_WhenWithinSameHour_ReturnsTrue()
    {
        var first = new DateFee(DateTime.Parse("2025-01-01 11:17"), 42);
        var second = new DateFee(DateTime.Parse("2025-01-01 12:17"), 42);

        Assert.True(first.SameHour(second));
        Assert.True(second.SameHour(first));
    }
    [Fact]
    public void SameHour_WhenNotWithinSameHour_ReturnsFalse()
    {
        var first = new DateFee(DateTime.Parse("2025-01-01 11:17"), 42);
        var second = new DateFee(DateTime.Parse("2025-01-01 12:18"), 42);

        Assert.False(first.SameHour(second));
        Assert.False(second.SameHour(first));
    }
}