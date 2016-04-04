using System;
using System.Collections.Generic;
using System.Linq;

namespace Sitecore.Admin.Cache
{
  using System.Diagnostics;
  using System.Threading;
  using Microsoft.AspNet.SignalR;

  using Sitecore.CacheObserver.Configuration;
  using Sitecore.Caching;

  public class CacheObserverBroadcaster
  {
    private readonly IHubContext<ICacheObserverClient> hubContext;

    private static readonly Lazy<CacheObserverBroadcaster> instance =
      new Lazy<CacheObserverBroadcaster>(() => new CacheObserverBroadcaster(GlobalHost.ConnectionManager.GetHubContext<CacheObserverHub, ICacheObserverClient>()));

    private TimeSpan updateInterval = TimeSpan.FromMilliseconds(1000);

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
            this.timer = new Timer(this.UpdateCaches, null, TimeSpan.Zero, this.updateInterval);
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
          this.timer = null;
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

    public void SetUpdateInterval(int newUpdateInterval, string connectionId)
    {
      if (newUpdateInterval >= Settings.CacheObserver.MinUpdateInterval
          && newUpdateInterval <= Settings.CacheObserver.MaxUpdateInterval)
      {
        this.updateInterval = TimeSpan.FromMilliseconds(newUpdateInterval);
        lock (this.connectionIds)
        {
          this.timer?.Change(TimeSpan.Zero, this.updateInterval);
        }

        this.hubContext.Clients.AllExcept(connectionId).SetUpdateInterval((int)this.updateInterval.TotalMilliseconds);
      }
    }

    public void GetUpdateInterval(string connectionId)
    {
      this.hubContext.Clients.Client(connectionId).SetUpdateInterval((int)this.updateInterval.TotalMilliseconds);
    }
  }
}

