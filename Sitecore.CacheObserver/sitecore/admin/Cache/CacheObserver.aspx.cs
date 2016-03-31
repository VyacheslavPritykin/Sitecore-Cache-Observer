using System;
using System.Web;

namespace Sitecore.Admin.Cache
{
  public partial class CacheObserver : System.Web.UI.Page
  {
    protected override void OnInit(EventArgs e)
    {
      base.OnInit(e);
      var user = Sitecore.Context.User;

      if (user.IsAdministrator)
      {
        return;
      }

      if (user.IsInRole("sitecore\\developer") ||
          user.IsInRole("sitecore\\sitecore client developing"))
      {
        return;
      }

      var site = Sitecore.Context.Site;

      if (site != null)
      {
        this.Response.Redirect($"{site.LoginPage}?returnUrl={HttpUtility.UrlEncode(this.Request.Url.PathAndQuery)}");
      }
    }
  }
}