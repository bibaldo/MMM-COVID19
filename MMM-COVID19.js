/* global Module */

/* Magic Mirror
 * Module: MMM-COVID19
 *
 * By Jose Forte
 * MIT Licensed.
 */

Module.register("MMM-COVID19", {
  countriesStats: {},
  globalStats: { "total_cases": "", "total_deaths": "", "total_recovered": "" }, // beautify things at start
  defaults: {
    header: 'COVID-19',    
    countries: [ "Argentina", "Italy", "Spain", "Germany" ], // default list
    orderCountriesByName: false,
    orderAscending: false,
    lastUpdateInfo: false,
    worldStats: false,
    delta: false,
    rapidapiKey : "", // X-RapidAPI-Key provided at https://rapidapi.com/astsiatsko/api/coronavirus-monitor
    headerRowClass: "small", // small, medium or big
    infoRowClass: "big", // small, medium or big
    updateInterval: 300000, // update interval in milliseconds
    fadeSpeed: 4000
  },

  getStyles: function() {
    return ["MMM-COVID19.css"]
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
      es: "translations/es.json"
	  }
  },

  start: function() {
    this.getInfo()
    this.scheduleUpdate()
  },

  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay
    }
    var self = this
    setInterval(function() {
      self.getInfo()
    }, nextLoad)
  },

  getInfo: function () {
    this.sendSocketNotification('GET_BY_COUNTRY_STATS', this.config.rapidapiKey)

    if (this.config.worldStats) {
      this.sendSocketNotification('GET_GLOBAL_STATS', this.config.rapidapiKey)
    }
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this
    if (notification === "BYCOUNTRY_RESULT") {
      this.countriesStats = payload
      this.updateDom(self.config.fadeSpeed)
    }
    if (notification === "GLOBAL_RESULT") {
      this.globalStats = payload
      this.updateDom(self.config.fadeSpeed)
    }
  },

  getHeader: function() {
    return this.config.header
  },

  getDom: function() {
    var countriesList = this.config.countries
    var countriesStats = this.countriesStats["countries_stat"]
    var globalStats = this.globalStats
    if (this.config.orderCountriesByName && countriesStats) {
		countriesStats.sort(this.compareValues('country_name', this.config.orderAscending))
    } else if (countriesStats) {
		countriesStats.sort(this.compareValues('cases', this.config.orderAscending))
	}
    var wrapper = document.createElement("table")
    wrapper.className = this.config.tableClass || 'covid'

    // header row
    var headerRow = document.createElement("tr"),
        headerconfirmedCell = document.createElement("td"),
        headerNewConfirmedCell = document.createElement("td"),
        headerCountryNameCell = document.createElement("td"),
        headerrecoveredCell = document.createElement("td"),
        headerdeathsCell = document.createElement("td"),
        headerNewDeathsCell = document.createElement("td"),
        headeractiveCell = document.createElement("td")

    headerCountryNameCell.innerHTML = ''
    headerconfirmedCell.className = 'number confirmed ' + this.config.headerRowClass
    headerconfirmedCell.innerHTML = this.translate('Confirmed')
    headerNewConfirmedCell.className = 'number confirmed ' + this.config.headerRowClass
    headerNewConfirmedCell.innerHTML = this.translate('New Cases')
    headerdeathsCell.className = 'number deaths ' + this.config.headerRowClass
    headerdeathsCell.innerHTML = this.translate('Deaths')
    headerNewDeathsCell.className = 'number deaths ' + this.config.headerRowClass
    headerNewDeathsCell.innerHTML = this.translate('New Deaths')
    headerrecoveredCell.className = 'number recovered ' + this.config.headerRowClass
    headerrecoveredCell.innerHTML = this.translate('Recovered')
    headeractiveCell.className = 'number active ' + this.config.headerRowClass
    headeractiveCell.innerHTML = this.translate('Active')

    headerRow.appendChild(headerCountryNameCell)
    headerRow.appendChild(headerconfirmedCell)
    if (this.config.delta) {
      headerRow.appendChild(headerNewConfirmedCell)
    }
    headerRow.appendChild(headerdeathsCell)
    if (this.config.delta) {
      headerRow.appendChild(headerNewDeathsCell)
    }
    headerRow.appendChild(headerrecoveredCell)
    headerRow.appendChild(headeractiveCell)

    wrapper.appendChild(headerRow)
    // WorldWide row, activate it via config
    if (this.config.worldStats) {
      let worldRow = document.createElement("tr"),
          worldNameCell = document.createElement("td"),
          confirmedCell = document.createElement("td"),
          newCasesCell = document.createElement("td"),
          deathsCell = document.createElement("td"),
          newDeathsCell = document.createElement("td"),
          recoveredCell = document.createElement("td"),
          activeCell = document.createElement("td"),
          cases = globalStats["total_cases"],
          newCases = globalStats["new_cases"],
          deaths = globalStats["total_deaths"],
          newDeaths = globalStats["new_deaths"],
          totalRecovered = globalStats["total_recovered"],
          activeCases = '';

      worldNameCell.innerHTML = this.translate('Worldwide')
      worldNameCell.className = this.config.infoRowClass
      worldRow.className = 'world ' + this.config.infoRowClass
      confirmedCell.className = 'number confirmed ' + this.config.infoRowClass
      confirmedCell.innerHTML = cases
      newCasesCell.className = 'number confirmed ' + this.config.infoRowClass
      if (newCases) {
        newCasesCell.innerHTML = newCases
      }
      deathsCell.className = 'number deaths ' + this.config.infoRowClass
      deathsCell.innerHTML = deaths
      newDeathsCell.className = 'number deaths ' + this.config.infoRowClass
      if (newDeaths) {
        newDeathsCell.innerHTML = newDeaths
      }
      recoveredCell.className = 'number recovered ' + this.config.infoRowClass
      recoveredCell.innerHTML = totalRecovered
      activeCell.className = 'number active ' + this.config.infoRowClass
      activeCell.innerHTML = activeCases

      worldRow.appendChild(worldNameCell)
      worldRow.appendChild(confirmedCell)
      if (this.config.delta) {
        worldRow.appendChild(newCasesCell)
      }
      worldRow.appendChild(deathsCell)
      if (this.config.delta) {
        worldRow.appendChild(newDeathsCell)
      }
      worldRow.appendChild(recoveredCell)
      worldRow.appendChild(activeCell)
      
      wrapper.appendChild(worldRow)
    }
    // countries row, one per country listed at config => countries
    for (let key in countriesStats) {
      let value = countriesStats[key]
      if (countriesList.indexOf(value["country_name"]) != -1) {
        let countryRow = document.createElement("tr"),
            countryNameCell = document.createElement("td"),
            confirmedCell = document.createElement("td"),
            newCasesCell = document.createElement("td"),
            deathsCell = document.createElement("td"),
            newDeathsCell = document.createElement("td"),
            recoveredCell = document.createElement("td"),
            activeCell = document.createElement("td"),
            countryName = value["country_name"],
            cases = value["cases"],
            deaths = value["deaths"],
            newCases = value["new_cases"],
            newDeaths = value["new_deaths"],
            totalRecovered = value["total_recovered"],
            activeCases = value["active_cases"];

        countryNameCell.innerHTML = countryName
        countryNameCell.className = this.config.infoRowClass
        confirmedCell.className = 'number confirmed ' + this.config.infoRowClass
        confirmedCell.innerHTML = cases
        newCasesCell.className = 'number confirmed ' + this.config.infoRowClass
        if (newCases) {
          newCasesCell.innerHTML = '+' + newCases
        }
        deathsCell.className = 'number deaths ' + this.config.infoRowClass
        deathsCell.innerHTML = deaths
        newDeathsCell.className = 'number deaths ' + this.config.infoRowClass
        if (newDeaths) {
          newDeathsCell.innerHTML = '+' + newDeaths
        }
        recoveredCell.className = 'number recovered ' + this.config.infoRowClass
        recoveredCell.innerHTML = totalRecovered
        activeCell.className = 'number active ' + this.config.infoRowClass
        activeCell.innerHTML = activeCases

        countryRow.appendChild(countryNameCell)
        countryRow.appendChild(confirmedCell)
        if (this.config.delta) {
          countryRow.appendChild(newCasesCell)
        }
        countryRow.appendChild(deathsCell)
        if (this.config.delta) {
          countryRow.appendChild(newDeathsCell)
        }
        countryRow.appendChild(recoveredCell)
        countryRow.appendChild(activeCell)
        
        wrapper.appendChild(countryRow)
      }
    }
    if (this.config.lastUpdateInfo) {
      let statsDateRow = document.createElement("tr"),
          statsDateCell = document.createElement("td");

      statsDateCell.innerHTML = this.translate('statistic taken at ') + this.countriesStats['statistic_taken_at'] + ' (UTC)'
      if (this.config.delta) {
      		statsDateCell.colSpan = "7"
    	} else {
		statsDateCell.colSpan = "5"
	}
      statsDateCell.className = 'last-update'

      statsDateRow.appendChild(statsDateCell)
      wrapper.appendChild(statsDateRow)
    }

		return wrapper
  },
  // sort according to some key and the order could be 'asc' or 'desc'
  compareValues: function(key, order ) {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0
      }
  
	  let varAlpha = Number(a[key].replace(/,/g,''))
	  let varBeta = Number(b[key].replace(/,/g,''))
	  
	  const varA = (Number.isNaN(varAlpha))
        ? a[key].toUpperCase() : varAlpha
      const varB = (Number.isNaN(varBeta))
        ? b[key].toUpperCase() : varBeta
  
      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return (
        (!order) ? (comparison * -1) : comparison
      );
    }
  },  

})
