namespace Sitecore.Admin.Cache
{
  using System.Security.Principal;
  using Microsoft.AspNet.SignalR;
  using Sitecore.Security.Accounts;

  class SitecoreDeveloperAuthorizeAttribute : AuthorizeAttribute
  {
    protected override bool UserAuthorized(IPrincipal user)
    {
      var sitecoreUser = user as User;
      if (sitecoreUser != null && sitecoreUser.IsAdministrator)
      {
        return true;
      }

      if (user.IsInRole("sitecore\\developer") ||
          user.IsInRole("sitecore\\sitecore client developing"))
      {
        return true;
      }

      return false;
    }
  }
}