<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="CacheObserver.aspx.cs" Inherits="Sitecore.Admin.Cache.CacheObserver" %>
<%@ Import Namespace="Sitecore.CacheObserver.Configuration" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Cache Observer</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link href="/sitecore/images/favicon.ico" rel="shortcut icon" />
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600" rel="stylesheet" type="text/css" />
    <link href="/sitecore/admin/cache/style.css" rel="stylesheet" type="text/css" />

    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.2.3.min.js"></script>
    <script>window.jQuery || document.write('<script src="/scripts/jquery-2.2.3.min.js">\x3C/script>')</script>

    <script src="http://ajax.aspnetcdn.com/ajax/knockout/knockout-3.4.0.js"></script>
    <script>window.ko || document.write('<script src="/scripts/knockout-3.4.0.js">\x3C/script>')</script>

    <script src="http://ajax.aspnetcdn.com/ajax/signalr/jquery.signalr-2.2.0.min.js"></script>
    <script>window.jQuery.connection || document.write('<script src="/scripts/jquery.signalR-2.2.0.min.js">\x3C/script>')</script>

    <script src="/scripts/smoothie.js"></script>
    <script src="<%: Sitecore.Configuration.Settings.GetSetting("SignalR.Path", "/signalr") %>/hubs"></script>
    <script src="/sitecore/admin/cache/script.js"></script>
</head>
<body>
    <h2>Cache Observer</h2>
    <input type="search" placeholder="Filter" data-bind="textInput: filter" />
    <span class="delimeter">|</span>
    <input type="button" value="Clear all" data-bind="click: clearAllCaches" />
    <span class="delimeter">|</span>
    <span>Update interval: </span>
    <span class="updateIntervalValue" data-bind="text: updateInterval"></span>
    <span>ms</span>
    <input class="updateIntervalRange" type="range" data-bind="value: updateInterval"
        min="<%: Settings.CacheObserver.MinUpdateInterval %>"
        max="<%: Settings.CacheObserver.MaxUpdateInterval %>"
        step="<%: Settings.CacheObserver.ChangeUpdateIntervalStep %>"/>
    <span class="delimeter">|</span>
    <input type="button" value="Start live update" data-bind="click: startCacheUpdate, visible: !isUpdating()" />
    <input type="button" value="Stop live update" data-bind="click: stopCacheUpdate, visible: isUpdating" />
    <table class="cachesTable" style="width: 700px">
        <thead>
            <tr>
                <th></th>
                <!-- ko foreach: infoColumns -->
                <th class="infoColumTitle" data-bind="css: cssAlign, click: $parent.sort">
                    <span class="unselectable" data-bind="text: title, css: { sorted: sorted, asc: sorted() && asc(), desc: sorted() && !asc() }"></span>
                    <div class="sortContainer">
                        <div class="sort sortUp">&#9650;</div>
                        <div class="sort sortDown">&#9660;</div>
                    </div>
                </th>
                <!-- /ko -->
                <th></th>
            </tr>
            <tr>
                <td></td>
                <td>
                    <h4>Total</h4>
                </td>
                <td class="textRight"><span data-bind="text: totalCount"></span></td>
                <td class="textRight"><span data-bind="text: totalSize"></span></td>
                <td class="textRight"><span data-bind="text: totalMaxSize"></span></td>
                <td></td>
                <td><a href="#" data-bind="click: clearFilteredCaches">Clear</a></td>
            </tr>
        </thead>
        <tbody>
            <!-- ko foreach: caches -->
            <tr data-bind="visible: isPassedNameFilter($parent.filter())">
                <td class="collaspibleIconCell unselectable">
                    <div class="collapsibleIcon collapsibleIconCollapsed" data-bind="visible: !isChartVisible(), click: showChart.bind($data, $parent.updateInterval())">&#9658;</div>
                    <div class="collapsibleIcon collapsibleIconExpanded" data-bind="visible: isChartVisible, click: closeChart">&#9698;</div>
                </td>
                <td><span data-bind="text: name"></span></td>
                <td class="textRight"><span data-bind="text: count"></span></td>
                <td class="textRight"><span data-bind="text: sizeString"></span></td>
                <td class="textRight"><span data-bind="text: maxSizeString"></span></td>
                <td class="textRight"><span data-bind="text: load() + '%'"></span></td>
                <td><a href="#" data-bind="click: $parent.clearCache">Clear</a></td>
            </tr>
            <tr data-bind="if: isChartVisible, visible: isPassedNameFilter($parent.filter())">
                <td></td>
                <td colspan="6">
                    <canvas class="chart" data-bind="attr: { id: chartId }" width="670" height="100"></canvas>
                </td>
            </tr>
            <!-- /ko -->
        </tbody>
    </table>
</body>
</html>
