using Microsoft.AspNet.SignalR;

namespace Sitecore.Admin.Cache
{
  using System.Threading.Tasks;
  using Sitecore.Caching;

  [SitecoreDeveloperAuthorize]
  public class CacheObserverHub : Hub<ICacheObserverClient>
  {
    public CacheObserverBroadcaster Broadcaster { get; set; }

    public CacheObserverHub() : this(CacheObserverBroadcaster.Instance)
    {
    }

    public CacheObserverHub(CacheObserverBroadcaster broadcaster)
    {
      this.Broadcaster = broadcaster;
    }

    public void StartCacheUpdate()
    {
      this.Broadcaster.StartCacheUpdate(this.Context.ConnectionId);
    }

    public void StopCacheUpdate()
    {
      this.Broadcaster.StopCacheUpdate(this.Context.ConnectionId);
    }

    public void ClearAllCaches()
    {
      CacheManager.ClearAllCaches();
    }

    public void ClearCaches(List<ID> cacheIds)
    {
      foreach (var cache in CacheManager.GetAllCaches().Where(cache => cacheIds.Contains(cache.Id)))
      {
        cache.Clear();
      }
    }

    public void ClearCache(ID cacheID)
    {
      CacheManager.GetAllCaches().FirstOrDefault(cache => cache.Id == cacheID)?.Clear();
    }

    public override Task OnDisconnected(bool stopCalled)
    {
      this.Broadcaster.StopCacheUpdate(this.Context.ConnectionId);
      return base.OnDisconnected(stopCalled);
    }
  }
}