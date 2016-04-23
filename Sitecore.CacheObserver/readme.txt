Please see https://github.com/VyacheslavPritykin/Sitecore-Cache-Observer for more information on using Sitecore Cache Observer

Configuring
-----------

Sitecore Cache Observer uses SignalR for live updates and SignalR needs to be initialized as an OWIN middleware.

If you dont have configured OWIN in your Sitecore instance, then the easiest way to make Sitecore Cache Observer work
is to install Sitecore SignalR (https://github.com/VyacheslavPritykin/Sitecore-SignalR) nuget package:

Install-Package Sitecore.SignalR

Otherwise, add a call of app.MapSignalR() in your Startup class and update IgnoreUrlPrefixes setting in the config to ignore "/signalr".

How to use?
-----------

Navigate to /sitecore/admin/cache/cacheobserver.aspx.
The page requires the same permissions as the /sitecore/admin/cache.aspx: the user must be either an administrator
or be in the 'sitecore\developer' or 'sitecore\sitecore client developing' role.