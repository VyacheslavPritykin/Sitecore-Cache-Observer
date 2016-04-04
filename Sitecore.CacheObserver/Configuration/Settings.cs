namespace Sitecore.CacheObserver.Configuration
{
  public static class Settings
  {
    public static class CacheObserver
    {
      public static int MinUpdateInterval => Sitecore.Configuration.Settings.GetIntSetting("CacheObserver.MinUpdateInterval", 400);
      public static int MaxUpdateInterval => Sitecore.Configuration.Settings.GetIntSetting("CacheObserver.MaxUpdateInterval", 5000);
      public static int ChangeUpdateIntervalStep => Sitecore.Configuration.Settings.GetIntSetting("CacheObserver.ChangeUpdateIntervalStep", 200);
    }
  }
}
