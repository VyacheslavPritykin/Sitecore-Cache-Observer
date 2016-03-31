namespace Sitecore.Admin.Cache
{
  public struct CacheViewModel
  {
    public string Id { get; set; }
    public string Name { get; set; }
    public int Count { get; set; }
    public long Size { get; set; }
    public long MaxSize { get; set; }
  }
}