using System;
using System.Collections.Generic;
using System.Linq;

namespace Sitecore.Admin.Cache
{
  using System.Threading;
  using Microsoft.AspNet.SignalR;
  using Sitecore.Caching;

  public class CacheObserverBroadcaster
  {
    private readonly IHubContext<ICacheObserverClient> hubContext;

    private static readonly Lazy<CacheObserverBroadcaster> instance =
      new Lazy<CacheObserverBroadcaster>(() => new CacheObserverBroadcaster(GlobalHost.ConnectionManager.GetHubContext<CacheObserverHub, ICacheObserverClient>()));

    private TimeSpan updateInterval = TimeSpan.FromMilliseconds(500);

    private Timer timer;
    private readonly object updateCachesLock = new object();
    private bool updatingCaches;
    private readonly List<string> connectionIds = new List<string>();

    private CacheObserverBroadcaster(IHubContext<ICacheObserverClient> hubContext)
    {
      this.hubContext = hubContext;
    }

    public static CacheObserverBroadcaster Instance
    {
      get { return instance.Value; }
    }

    public void StartCacheUpdate(string connectionId)
    {
      lock (this.connectionIds)
      {
        if (!this.connectionIds.Contains(connectionId))
        {
          this.connectionIds.Add(connectionId);
          if (this.connectionIds.Count == 1)
          {
            this.timer = new Timer(this.UpdateCaches, null, this.updateInterval, this.updateInterval);
          }
        }
      }
    }

    public void StopCacheUpdate(string connectionId)
    {
      lock (this.connectionIds)
      {
        if (this.connectionIds.Remove(connectionId) && this.connectionIds.Count == 0)
        {
          this.timer.Dispose();
        }
      }
    }

    private void UpdateCaches(object state)
    {
      if (this.updatingCaches)
      {
        return;
      }

      lock (this.updateCachesLock)
      {
        if (!this.updatingCaches)
        {
          this.updatingCaches = true;

          var cacheViewModels = CacheManager.GetAllCaches().Select(cache => new CacheViewModel
          {
            Id = cache.Id.Guid.ToString("N"),
            Name = cache.Name,
            Count = cache.Count,
            Size = cache.Size,
            MaxSize = cache.MaxSize
          });

          this.BroadCastCaches(cacheViewModels.OrderBy(model => model.Name));

          this.updatingCaches = false;
        }
      }
    }

    private void BroadCastCaches(IEnumerable<CacheViewModel> cacheViewModels)
    {
      this.hubContext.Clients.All.UpdateAllCaches(cacheViewModels);
    }
  }
}

