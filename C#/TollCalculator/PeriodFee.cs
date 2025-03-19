namespace TollFeeCalculator;

public class PeriodFee(TimeOnly start, TimeOnly end, int fee)
{
    private TimeOnly Start { get; } = start;
    private TimeOnly End { get; } = end;
    public int Fee { get; } = fee;
    public bool InPeriod(DateTime date) => TimeOnly.FromDateTime(date).IsBetween(Start, End);
}