const MAP_WRAP_CLASS = 'js-stats-map-wrap';
const MAP_PARENT_CLASS = 'js-stats-map-parent';
const MAP_PRINT_CLASS = 'js-stats-map-print';
const MAP_CLASS = 'js-stats-map';
const MAP_GRID_CLASS = 'js-stats-map-grid';

const MAP_DATA = {
  request: {
    'RU-ALT': 34,
    'RU-BEL': 45,
    'RU-STA': 294,
    'RU-KHA': 3,
    'RU-LIP': 100,
    'RU-PNZ': 188,
    'RU-TAM': 1000,
    'RU-KYA': 56,
    'RU-CHU': 744,
    'RU-KO': 700,
  },
  success: {
    'RU-ALT': 34,
    'RU-BEL': 5,
    'RU-STA': 294,
    'RU-KHA': 3,
    'RU-LIP': 3455,
    'RU-PNZ': 188,
    'RU-KYA': 2200,
    'RU-KO': 1500,
    'RU-CHU': 221,
    'RU-TAM': 233,
  },
  fail: {
    'RU-ALT': 2323,
    'RU-BEL': 45,
    'RU-STA': 43,
    'RU-KHA': 3,
    'RU-KYA': 1200,
    'RU-LIP': 23,
    'RU-KO': 1990,
    'RU-PNZ': 188,
    'RU-CHU': 244,
    'RU-TAM': 443,
  },
};

const Map = class {
  constructor (mapParent, ajaxData) {
    this.parent = mapParent;
    this.printButton = this.parent.querySelector(`.${MAP_PRINT_CLASS}`);
    this.mapElement = this.parent.querySelector(`.${MAP_CLASS}`);
    this.grid = this.mapElement.parentNode.querySelector(`.${MAP_GRID_CLASS}`);
    this.type = this.mapElement.dataset.chartType;
    this._options = {
      center: [66.868747, 100.365425],
      zoom: 2,
      controls: [],
    };
    this._defaultGeoOptions = {
      fillColor: '#ffffff',
      fillOpacity: 0,
      strokeStyle: 'solid',
      strokeColor: '#ffffff',
      strokeOpacity: 0.0000001,
    };
    this.init(ajaxData);
  }

  _getPointsCollection (data) {
    let pointsFeatures = [];
    for (const [regionId, regionData] of Object.entries(data)) {
      if (typeof regionData.points != 'undefined') {
        for (const [key, points] of Object.entries(regionData.points)) {
          let pointFeature = {
            type: "Feature",
            id: key,
            geometry: {
              type: "Point",
              coordinates: points.coords
            },
            properties: {
              balloonContent: points.name
            },
            options: {
              iconLayout: 'default#image',
              iconImageHref: '/local/templates/ibrush/svg_icons/map-icon-statistic.svg',
            }
          }
          pointsFeatures.push(pointFeature);
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features: pointsFeatures
    };
  }

  init (ajaxData) {
    this.map = new ymaps.Map(this.mapElement, this._options);
    this.map.panes.get('ground').getElement().style.filter = 'grayscale(100%)';
    const data = ajaxData[this.type];
    let dataNumbers = objectMap(data, function(obj) {
      return obj.count;
    });
    dataNumbers = Object.values(dataNumbers);
    if (!dataNumbers.length) return;

    let pointsCollection = this._getPointsCollection(data);

    ymaps.ready(() => {

      ymaps.borders.load('RU', {
        lang: 'ru',
        quality: 2,
        }).then(geojson => {
          this.collection = geojson.features.map(feature => {
            const region = feature.properties.iso3166;
            feature.id = region;

            if (typeof data[region] !== 'undefined' && data[region].count > 0) {
              const count = data[region].count;
              const percent = this._getPercent(count, dataNumbers)
              const color = this._getColor(percent);
              feature.options = {
                fillColor: color,
                fillOpacity: 0.4,
                strokeColor: color,
                strokeStyle: 'solid',
                strokeOpacity: 0.5,
              };
            } else {
              feature.options = this._defaultGeoOptions;
            }
            return feature;
          });
          const objectCollection = {
            type: 'FeatureCollection',
            features: this.collection,
          };

          this.geoQuery = ymaps.geoQuery(objectCollection).addToMap(this.map);
          this.geoQueryPoints = ymaps.geoQuery(pointsCollection).addToMap(this.map);

          // const geoObject = this.geoQuery.searchContaining([55.771064, 37.661527]).get(0);
          // geoObject.options.set({
          //   fillColor: '#ff0000',
          //   fillOpacity: 1,
          // });
        })
        .catch(error => console.log(error));
      this._setGrid(dataNumbers);
    });
  }

  update (ajaxData) {

    this.map.destroy();
    this.init(ajaxData);
    return;

    const data = ajaxData[this.type];
    let dataNumbers = objectMap(data, function(obj) {
      return obj.count;
    });
    dataNumbers = Object.values(dataNumbers);
    this.geoQuery.each((geoObject) => {
      const region = geoObject.properties.get('iso3166');
      if (typeof data[region] !== 'undefined') {
        const count = data[region].count;
        const percent = this._getPercent(count, dataNumbers);
        const color = this._getColor(percent);
        geoObject.options.set({
          fillColor: color,
          fillOpacity: 0.4,
          strokeColor: color,
          strokeStyle: 'solid',
          strokeOpacity: 0.5,
        });
      } else {
        geoObject.options.set(this._defaultGeoOptions);
      }
    });

    this.geoQueryPoints.each((geoObject) => {
      this.geoQueryPoints.remove(geoObject);
    });

    let pointsCollection = this._getPointsCollection(data);
    //this.map.destroy();
  }

  _getPercent (nubmer, array) {
    let min = Math.min(...array)
    let max = Math.max(...array);
    if (min == max) return 1;
    const maxNormalized =  max - min;
    return (nubmer - Math.min(...array)) / maxNormalized;
  }

  _setGrid (numbers) {
    const NUMBER = 10;
    const min = Math.round(Math.min(...numbers));
    const step = Math.round((Math.max(...numbers) - Math.min(...numbers)) / NUMBER);
    let listItems = ``;
    const array = new Array(NUMBER).fill(null).map((item, index) => {
      item = min + (step * index);
      listItems += `
        <li class="stats__map-grid-item">${item}</li>
      `;
      return item;
    });
    this.grid.innerHTML = listItems;
  }
}

import { getGradeInColor } from './helpers.js';

