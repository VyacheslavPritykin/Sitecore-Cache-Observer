namespace Sitecore.Admin.Cache
{
  using System.Collections.Generic;

  public interface ICacheObserverClient
  {
    void UpdateAllCaches(IEnumerable<CacheViewModel> caches);
  }
}