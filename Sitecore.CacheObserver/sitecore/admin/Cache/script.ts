// ReSharper disable InconsistentNaming
(() => {
    "use strict";

    interface IServerCache {
        Id: string;
        Name: string;
        Count: number;
        Size: number;
        MaxSize: number;
    }

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

        showChart() {
            this.isChartVisible(true);

            this.initChart();
            setTimeout(
                () => {
                    let canvas = document.getElementById(this.chartId) as HTMLCanvasElement;
                    this.chart.streamTo(canvas, 500);
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

        initChart() {
            let foo = (date: Date) => {

                let seconds = date.getSeconds();
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
    }

    class InfoColumn {
        constructor(public title: string,
            sorted: boolean,
            asc: boolean,
            public sortField: (cache: CacheViewModel) => string|number) {
            this.sorted = ko.observable(sorted);
            this.asc = ko.observable(asc);
        }

        sorted: KnockoutObservable<boolean>;
        asc: KnockoutObservable<boolean>;
    }

    class CacheObserverViewModel {
        constructor(private server: any) {}

        caches = ko.observableArray([] as CacheViewModel[]);

        infoColumns = [
            new InfoColumn("Cache name", true, true, cache => cache.name.toUpperCase()),
            new InfoColumn("Count", false, true, cache => cache.count()),
            new InfoColumn("Size", false, true, cache => cache.size()),
            new InfoColumn("MaxSize", false, true, cache => cache.maxSize()),
            new InfoColumn("Load", false, true, cache => cache.load())
        ];

        isUpdating = ko.observable(false);
        filter = ko.observable("");

        totalCount = ko.pureComputed(() => {
            let result = 0;
            for (let cache of this.caches().filter((x)=>x.isPassedNameFilter(this.filter()))) {
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

            // Uncomment for live sorting. Be aware that Chrome does not use stable sort algorithm for array.sort
            // if (false) {
            //     this.sort(ko.utils.arrayFirst(this.infoColumns, infoColumn => infoColumn.sorted()));
            // }
        }

        startCacheUpdate() {
            this.isUpdating(true);
            // this.caches().forEach(cache => cache.chart && cache.chart.start());
            this.server.startCacheUpdate();
        }

        stopCacheUpdate() {
            this.isUpdating(false);
            // this.caches().forEach(cache => cache.chart && cache.chart.stop());
            this.server.stopCacheUpdate();
        }

        clearAllCaches() {
            this.server.clearAllCaches();
        }

        sortAsc = (infoColumn: InfoColumn) => {
            this.sort(infoColumn, true);
        }

        sortDesc = (infoColumn: InfoColumn) => {
            this.sort(infoColumn, false);
        }

        sort = (infoColumn: InfoColumn, arg?: JQueryMouseEventObject | boolean) => {
            if (!infoColumn.sorted()) {
                this.infoColumns.forEach(x => x.sorted(false));
                infoColumn.sorted(true);
            }

            let asc: boolean;

            if (typeof arg == "boolean") {
                asc = arg as boolean;
            } else {
                asc = !infoColumn.asc();
            }

            infoColumn.asc(asc);

            this.caches.sort((left, right) => {
                const leftField = infoColumn.sortField(left);
                const rightField = infoColumn.sortField(right);
                return asc
                    ? leftField === rightField ? 0 : (leftField < rightField ? -1 : 1)
                    : leftField === rightField ? 0 : (leftField > rightField ? -1 : 1);
            });
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

        ko.applyBindings(cacheObserverViewModel);

        $.connection.hub
            .start()
            .done(() => {
                cacheObserverViewModel.startCacheUpdate();
            });
    });

})();