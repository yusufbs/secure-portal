namespace SecurePortal.Application.Common.Models;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public string? NextCursor { get; init; }
    public bool HasNextPage { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }

    public static PagedResult<T> Create(IReadOnlyList<T> items, int pageSize, string? nextCursor, int totalCount)
    {
        return new PagedResult<T>
        {
            Items = items,
            PageSize = pageSize,
            NextCursor = nextCursor,
            HasNextPage = !string.IsNullOrEmpty(nextCursor),
            TotalCount = totalCount
        };
    }
}
