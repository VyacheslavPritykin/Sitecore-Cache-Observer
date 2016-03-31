// ReSharper disable InconsistentNaming
(function () {
    "use strict";
    var CacheViewModel = (function () {
        function CacheViewModel(id, name, count, size, maxSize) {
            var _this = this;
            this.id = id;
            this.name = name;
            this.isChartVisible = ko.observable(false);
            this.count = ko.observable(count);
            this.size = ko.observable(size);
            this.maxSize = ko.observable(maxSize);
            this.chartId = "chart_" + this.id;
            this.sizeString = ko.pureComputed(function () {
                return Utils.getSizeString(_this.size());
            });
            this.maxSizeString = ko.pureComputed(function () {
                return Utils.getSizeString(_this.maxSize());
            });
            this.load = ko.pureComputed(function () {
                var maxSize = _this.maxSize();
                return maxSize !== 0 ? Math.floor(_this.size() / maxSize * 1000) / 10 : 0;
            });
        }
        CacheViewModel.prototype.showChart = function () {
            var _this = this;
            this.isChartVisible(true);
            this.initChart();
            setTimeout(function () {
                var canvas = document.getElementById(_this.chartId);
                _this.chart.streamTo(canvas, 500);
            }, 0);
        };
        CacheViewModel.prototype.closeChart = function () {
            this.isChartVisible(false);
            this.chart.stop();
            this.chart.removeTimeSeries(this.chartTimeSeries);
            this.chart = null;
            this.chartTimeSeries = null;
        };
        CacheViewModel.prototype.initChart = function () {
            var foo = function (date) {
                var seconds = date.getSeconds();
                return seconds % 5 === 0 ? seconds.toString() : '';
            };
            this.chart = new SmoothieChart({
                grid: { fillStyle: '#ffffff', strokeStyle: '#d9eaf4', sharpLines: true },
                labels: { fillStyle: '#4d4d4d', fontSize: 12 },
                millisPerPixel: 85,
                timestampFormatter: foo,
                maxValue: 100,
                minValue: 0
            });
            this.chartTimeSeries = new TimeSeries();
            this.chart.addTimeSeries(this.chartTimeSeries, { strokeStyle: '#117bbb', fillStyle: 'rgba(209,221,239,0.30)' });
        };
        CacheViewModel.prototype.updateСhartTimeSeries = function () {
            this.chartTimeSeries && this.chartTimeSeries.append(Date.now(), this.load());
        };
        CacheViewModel.prototype.isPassedNameFilter = function (filter) {
            return this.name.toUpperCase().indexOf(filter.toUpperCase()) > -1;
        };
        return CacheViewModel;
    }());
    var Utils = (function () {
        function Utils() {
        }
        Utils.getSizeString = function (size) {
            var unit = "";
            var isNegative = false;
            if (size < 0) {
                size = -size;
                isNegative = true;
            }
            if (size >= 1024) {
                size = size / 1024;
                unit = "KB";
                if (size >= 1024) {
                    size = size / 1024;
                    unit = "MB";
                    if (size >= 1024) {
                        size = size / 1024;
                        unit = "GB";
                    }
                }
            }
            if (isNegative) {
                size = -size;
            }
            return Math.round(size * 100) / 100 + unit;
        };
        return Utils;
    }());
    var InfoColumn = (function () {
        function InfoColumn(title, sorted, asc, sortField) {
            this.title = title;
            this.sortField = sortField;
            this.sorted = ko.observable(sorted);
            this.asc = ko.observable(asc);
        }
        return InfoColumn;
    }());
    var CacheObserverViewModel = (function () {
        function CacheObserverViewModel(server) {
            var _this = this;
            this.server = server;
            this.caches = ko.observableArray([]);
            this.infoColumns = [
                new InfoColumn("Cache name", true, true, function (cache) { return cache.name.toUpperCase(); }),
                new InfoColumn("Count", false, true, function (cache) { return cache.count(); }),
                new InfoColumn("Size", false, true, function (cache) { return cache.size(); }),
                new InfoColumn("MaxSize", false, true, function (cache) { return cache.maxSize(); }),
                new InfoColumn("Load", false, true, function (cache) { return cache.load(); })
            ];
            this.isUpdating = ko.observable(false);
            this.filter = ko.observable("");
            this.totalCount = ko.pureComputed(function () {
                var result = 0;
                for (var _i = 0, _a = _this.caches().filter(function (x) { return x.isPassedNameFilter(_this.filter()); }); _i < _a.length; _i++) {
                    var cache = _a[_i];
                    result += cache.count();
                }
                return result;
            });
            this.totalSize = ko.pureComputed(function () {
                var result = 0;
                for (var _i = 0, _a = _this.caches().filter(function (x) { return x.isPassedNameFilter(_this.filter()); }); _i < _a.length; _i++) {
                    var cache = _a[_i];
                    result += cache.size();
                }
                return Utils.getSizeString(result);
            });
            this.totalMaxSize = ko.pureComputed(function () {
                var result = 0;
                for (var _i = 0, _a = _this.caches().filter(function (x) { return x.isPassedNameFilter(_this.filter()); }); _i < _a.length; _i++) {
                    var cache = _a[_i];
                    result += cache.maxSize();
                }
                return Utils.getSizeString(result);
            });
            this.updateAllCaches = function (serverCaches) {
                if (!_this.isUpdating()) {
                    return;
                }
                for (var _i = 0, serverCaches_1 = serverCaches; _i < serverCaches_1.length; _i++) {
                    var serverCache = serverCaches_1[_i];
                    var matchedCache = ko.utils.arrayFirst(_this.caches(), function (cache) { return cache.id === serverCache.Id; });
                    if (!matchedCache) {
                        _this.caches.push(new CacheViewModel(serverCache.Id, serverCache.Name, serverCache.Count, serverCache.Size, serverCache.MaxSize));
                    }
                    else {
                        matchedCache.count(serverCache.Count);
                        matchedCache.size(serverCache.Size);
                        matchedCache.maxSize(serverCache.MaxSize);
                        matchedCache.updateСhartTimeSeries();
                    }
                }
                // Uncomment for live sorting. Be aware that Chrome does not use stable sort algorithm for array.sort
                // if (false) {
                //     this.sort(ko.utils.arrayFirst(this.infoColumns, infoColumn => infoColumn.sorted()));
                // }
            };
            this.sortAsc = function (infoColumn) {
                _this.sort(infoColumn, true);
            };
            this.sortDesc = function (infoColumn) {
                _this.sort(infoColumn, false);
            };
            this.sort = function (infoColumn, arg) {
                if (!infoColumn.sorted()) {
                    _this.infoColumns.forEach(function (x) { return x.sorted(false); });
                    infoColumn.sorted(true);
                }
                var asc;
                if (typeof arg == "boolean") {
                    asc = arg;
                }
                else {
                    asc = !infoColumn.asc();
                }
                infoColumn.asc(asc);
                _this.caches.sort(function (left, right) {
                    var leftField = infoColumn.sortField(left);
                    var rightField = infoColumn.sortField(right);
                    return asc
                        ? leftField === rightField ? 0 : (leftField < rightField ? -1 : 1)
                        : leftField === rightField ? 0 : (leftField > rightField ? -1 : 1);
                });
            };
        }
        CacheObserverViewModel.prototype.startCacheUpdate = function () {
            this.isUpdating(true);
            // this.caches().forEach(cache => cache.chart && cache.chart.start());
            this.server.startCacheUpdate();
        };
        CacheObserverViewModel.prototype.stopCacheUpdate = function () {
            this.isUpdating(false);
            // this.caches().forEach(cache => cache.chart && cache.chart.stop());
            this.server.stopCacheUpdate();
        };
        CacheObserverViewModel.prototype.clearAllCaches = function () {
            this.server.clearAllCaches();
        };
        return CacheObserverViewModel;
    }());
    $(function () {
        $.ajaxSetup({
            statusCode: {
                401: function () {
                    location.href = "/sitecore/admin/login.aspx?returnUrl=" + window.location.pathname;
                }
            },
            cache: false
        });
        var cacheObserverHub = $.connection.cacheObserverHub;
        ko.options.deferUpdates = true;
        var cacheObserverViewModel = new CacheObserverViewModel(cacheObserverHub.server);
        cacheObserverHub.client.updateAllCaches = cacheObserverViewModel.updateAllCaches;
        ko.applyBindings(cacheObserverViewModel);
        $.connection.hub
            .start()
            .done(function () {
            cacheObserverViewModel.startCacheUpdate();
        });
    });
})();
//# sourceMappingURL=script.js.map