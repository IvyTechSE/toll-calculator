namespace TollFeeCalculator;

public class DateFee(DateTime date, int fee)
{
    public DateTime Date { get; } = date;
    public int Fee { get; } = fee;

    public bool SameHour(DateFee other)
    {
        var diff = Date - other.Date;

        return Math.Abs(diff.TotalMinutes) <= 60;
    }
}