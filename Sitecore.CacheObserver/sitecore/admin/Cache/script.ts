(() => {
    "use strict";

    // ReSharper disable InconsistentNaming
    interface IServerCache {
        Id: string;
        Name: string;
        Count: number;
        Size: number;
        MaxSize: number;
    }
    // ReSharper restore InconsistentNaming

    class CacheViewModel {
        constructor(public id: string,
            public name: string,
            count: number,
            size: number,
            maxSize: number) {
            this.count = ko.observable(count);
            this.size = ko.observable(size);
            this.maxSize = ko.observable(maxSize);
            this.chartId = "chart_" + this.id;

            this.sizeString = ko.pureComputed(() => {
                return Utils.getSizeString(this.size());
            });

            this.maxSizeString = ko.pureComputed(() => {
                return Utils.getSizeString(this.maxSize());
            });

            this.load = ko.pureComputed(() => {
                let maxSize = this.maxSize();
                return maxSize !== 0 ? Math.floor(this.size() / maxSize * 1000) / 10 : 0;
            });
        }

        count: KnockoutObservable<number>;
        size: KnockoutObservable<number>;
        maxSize: KnockoutObservable<number>;

        sizeString: KnockoutComputed<string>;
        maxSizeString: KnockoutComputed<string>;
        load: KnockoutComputed<number>;

        chartId: string;
        chart: SmoothieChart;
        chartTimeSeries: TimeSeries;
        isChartVisible = ko.observable(false);

        showChart(updateInterval: number) {
            this.isChartVisible(true);

            this.initChart(updateInterval);
            setTimeout(
                () => {
                    let canvas = document.getElementById(this.chartId) as HTMLCanvasElement;
                    this.chart.streamTo(canvas, updateInterval);
                },
                0);
        }

        closeChart() {
            this.isChartVisible(false);
            this.chart.stop();
            this.chart.removeTimeSeries(this.chartTimeSeries);
            this.chart = null;
            this.chartTimeSeries = null;
        }

        initChart(updateInterval: number) {
            this.chart = new SmoothieChart({
                grid: {
                    fillStyle: '#ffffff',
                    strokeStyle: '#d9eaf4',
                    sharpLines: true,
                    verticalSections: 4
                },
                labels: {
                    fillStyle: '#4d4d4d',
                    fontSize: 12
                },
                timestampFormatter: (date: Date) => {
                    const seconds = date.getSeconds();
                    return seconds.toString();
                },
                maxValue: 100,
                minValue: 0
            });

            Utils.updateChartSpeedOption(this.chart, updateInterval);

            this.chartTimeSeries = new TimeSeries();

            this.chart.addTimeSeries(this.chartTimeSeries,
                { strokeStyle: '#117bbb', fillStyle: 'rgba(209,221,239,0.30)' });
        }

        updateСhartTimeSeries() {
            this.chartTimeSeries && this.chartTimeSeries.append(Date.now(), this.load());
        }

        isPassedNameFilter(filter: string) {
            return this.name.toUpperCase().indexOf(filter.toUpperCase()) > -1;
        }
    }

    class Utils {
        static getSizeString(size: number) {
            let unit = "";
            let isNegative = false;
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
        }

        static updateChartSpeedOption(chart: SmoothieChart, updateInterval: number) {
            chart.options.grid.millisPerLine = 2000 * updateInterval / 300;
            chart.options.millisPerPixel = 85 * updateInterval / 500;
        }
    }

    class InfoColumn {
        constructor(public title: string,
            sorted: boolean,
            asc: boolean,
            public sortField: (cache: CacheViewModel) => string | number,
            public cssAlign: "textLeft" | "textRight" = "textLeft") {
            this.sorted = ko.observable(sorted);
            this.asc = ko.observable(asc);
            this.initialSortDirection = asc;
        }

        private initialSortDirection: boolean;

        resetSortDirection() {
            this.asc(this.initialSortDirection);
        }

        sorted: KnockoutObservable<boolean>;
        asc: KnockoutObservable<boolean>;
    }

    class CacheObserverViewModel {
        constructor(private server: any) {
            this.updateInterval.subscribe((newValue) => {
                if (!this.updateIntervalIsUpdatedByServer) {
                    this.server.setUpdateInterval(newValue);
                }

                this.caches()
                    .forEach(cache => {
                        const chart = cache.chart;

                        if (chart) {
                            chart.delay = newValue;
                            Utils.updateChartSpeedOption(chart, newValue);
                        }
                    });
                this.updateIntervalIsUpdatedByServer = false;
                return true;
            });
        }

        updateInterval = ko.observable<number>();

        caches = ko.observableArray([] as CacheViewModel[]);

        infoColumns = [
            new InfoColumn("Cache name", false, false, cache => cache.name.toUpperCase()),
            new InfoColumn("Count", false, true, cache => cache.count(), "textRight"),
            new InfoColumn("Size", false, true, cache => cache.size(), "textRight"),
            new InfoColumn("MaxSize", false, true, cache => cache.maxSize(), "textRight"),
            new InfoColumn("Load", false, true, cache => cache.load(), "textRight")
        ];

        isUpdating = ko.observable(false);
        filter = ko.observable("");

        totalCount = ko.pureComputed(() => {
            let result = 0;
            for (let cache of this.caches().filter((x) => x.isPassedNameFilter(this.filter()))) {
                result += cache.count();
            }

            return result;
        });

        totalSize = ko.pureComputed(() => {
            let result = 0;
            for (var cache of this.caches().filter((x) => x.isPassedNameFilter(this.filter()))) {
                result += cache.size();
            }

            return Utils.getSizeString(result);
        });

        totalMaxSize = ko.pureComputed(() => {
            let result = 0;
            for (var cache of this.caches().filter((x) => x.isPassedNameFilter(this.filter()))) {
                result += cache.maxSize();
            }

            return Utils.getSizeString(result);
        });

        updateAllCaches: (serverCaches: IServerCache[]) => void = (serverCaches) => {
            if (!this.isUpdating()) {
                return;
            }

            for (var serverCache of serverCaches) {
                let matchedCache = ko.utils.arrayFirst(this.caches(), cache => cache.id === serverCache.Id);
                if (!matchedCache) {
                    this.caches.push(new CacheViewModel(serverCache.Id,
                        serverCache.Name,
                        serverCache.Count,
                        serverCache.Size,
                        serverCache.MaxSize));
                } else {
                    matchedCache.count(serverCache.Count);
                    matchedCache.size(serverCache.Size);
                    matchedCache.maxSize(serverCache.MaxSize);
                    matchedCache.updateСhartTimeSeries();
                }
            }

            let infoColumnToSort = ko.utils.arrayFirst(this.infoColumns, infoColumn => infoColumn.sorted());
            infoColumnToSort && this.sort(infoColumnToSort, infoColumnToSort.asc());
        }

        startCacheUpdate() {
            this.isUpdating(true);
            this.server.startCacheUpdate();
        }

        stopCacheUpdate() {
            this.isUpdating(false);
            this.server.stopCacheUpdate();
        }

        clearAllCaches() {
            this.server.clearAllCaches();
        }

        clearFilteredCaches() {
            const filter = this.filter();
            const filteredCacheIds = this.caches()
                .filter(cache => cache.isPassedNameFilter(filter))
                .map(cache => cache.id);

            this.server.clearCaches(filteredCacheIds);
        }

        clearCache = (cache: CacheViewModel) => {
            this.server.clearCache(cache.id);
        }

        sortAsc = (infoColumn: InfoColumn) => {
            this.sort(infoColumn, true);
        }

        sortDesc = (infoColumn: InfoColumn) => {
            this.sort(infoColumn, false);
        }

        sort = (infoColumn: InfoColumn, arg?: JQueryMouseEventObject | boolean) => {
            if (!infoColumn.sorted()) {
                this.infoColumns.forEach(x => {
                    x.sorted(false);
                    x.resetSortDirection();
                });
                infoColumn.sorted(true);
            }

            let asc: boolean;

            if (typeof arg === "boolean") {
                asc = arg;
            } else {
                asc = !infoColumn.asc();
            }

            infoColumn.asc(asc);

            // Two sort types since Chrome browser does not implement a stable sort algorithm for Array.sort
            if (typeof infoColumn.sortField(this.caches()[0]) === "number") {
                this.caches.sort((left, right) => {
                    let leftField: any = infoColumn.sortField(left),
                        rightField: any = infoColumn.sortField(right),
                        result = leftField - rightField;

                    if (result === 0) {
                        leftField = left.name;
                        rightField = right.name;
                        result = leftField < rightField ? 1 : -1;
                    }

                    return asc ? result : -result;
                });
            } else {
                this.caches.sort((left, right) => {
                    let leftField = infoColumn.sortField(left),
                        rightField = infoColumn.sortField(right),
                        result = leftField === rightField ? 0 : (leftField < rightField ? -1 : 1);

                    return asc ? result : -result;
                });
            }           
        }

        private updateIntervalIsUpdatedByServer = false;

        setUpdateInterval = (newUpdateInterval: number) => {
            this.updateIntervalIsUpdatedByServer = true;
            this.updateInterval(newUpdateInterval);
        }
    }

    $(() => {
        $.ajaxSetup({
            statusCode: {
                401: () => {
                    location.href = `/sitecore/admin/login.aspx?returnUrl=${window.location.pathname}`;
                }
            },
            cache: false
        });

        let cacheObserverHub = ($.connection as any).cacheObserverHub;
        ko.options.deferUpdates = true;

        var cacheObserverViewModel = new CacheObserverViewModel(cacheObserverHub.server);

        cacheObserverHub.client.updateAllCaches = cacheObserverViewModel.updateAllCaches;
        cacheObserverHub.client.setUpdateInterval = cacheObserverViewModel.setUpdateInterval;

        ko.applyBindings(cacheObserverViewModel);

        $.connection.hub
            .start()
            .done(() => {
                cacheObserverHub.server.getUpdateInterval();
                cacheObserverViewModel.startCacheUpdate();
            });
    });

})();