# Sitecore Cache Observer
Advanced cache monitoring tool for Sitecore that was designed to replace built-in
_/sitecore/admin/cache.aspx_

## What it can do?

1. Display cache statistic for each cache:
 1. Amount of objects in cache
 2. Occupied cache size
 3. Max cache size
 4. Cache load
2. Perform live update
3. Show live chart for each cache to display its loading
4. Filter
5. Display total cache statistic for filtered caches
6. Sort
7. Clear caches

## How to install?

### Setup SignalR
Sitecore Cache Observer uses [SignalR](http://www.asp.net/signalr) for live updates and SignalR needs to be initialized as an OWIN middleware.

If you don't have configured OWIN in your Sitecore instance, then the easiest way to make Sitecore Cache Observer work
is to install [Sitecore SignalR](https://github.com/VyacheslavPritykin/Sitecore-SignalR) nuget package:

```
Install-Package Sitecore.SignalR
```

Otherwise add a call of `app.MapSignalR()` in your `Startup` class and update `IgnoreUrlPrefixes` setting in config to ignore _/signalr_. 

### Installing Sitecore Cache Observer
```
Install-Package Sitecore.CacheObserver
```
## How to use?

Navigate to _/sitecore/admin/cache/cacheobserver.aspx_. The page requires the same permissions as the _/sitecore/admin/cache.aspx_: the user must be either an administrator or be in the _'sitecore\developer'_ or *'sitecore\sitecore client developing'* role.
