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
Sitecore Cache Observer uses SignalR for live updates and SignalR needs to be initialized as an OWIN middleware.

If you dont have configured OWIN in you Sitecore instance, then you should install
[Sitecore OWIN](https://github.com/VyacheslavPritykin/Sitecore-OWIN) and [Sitecore SignalR](https://github.com/VyacheslavPritykin/Sitecore-SignalR).
Otherwise just add call of `app.MapSignalR()` in your `Startup` class and update `IgnoreUrlPrefixes` setting in config to ignore _/signalr_ too. 

### Install Sitecore Cache Observer package
Before install, add the following assembly binding into the _Web.config_ `runtime/assemblyBinding`:

```xml
 <dependentAssembly>
   <assemblyIdentity name="Microsoft.Owin.Security" publicKeyToken="31bf3856ad364e35" culture="neutral" />
   <bindingRedirect oldVersion="0.0.0.0-3.0.1.0" newVersion="3.0.1.0" />
 </dependentAssembly>
```

Follow the link [Sitecore Cache Observer](https://marketplace.sitecore.net/Modules/S/Sitecore_Cache_Observer.aspx) to download the package from Sitecore Marketplace and install it via Sitecore Installation Wizard.

## How to use?

Navigate to _/sitecore/admin/cache/cacheobserver.aspx_. The page requires the same permissions as the _/sitecore/admin/cache.aspx_: the user must be either an administrator or be in _'sitecore\developer'_ or *'sitecore\sitecore client developing'* role.
