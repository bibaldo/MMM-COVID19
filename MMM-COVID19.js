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
    orderCountriesByName: false, // false will sort by total number of confirmed cases 
    orderAscending: false, // sort order, true = ascending, false = descending
    lastUpdateInfo: false,
    worldStats: false,
    delta: false,
    showExtraInfo: false,
    highlightCountry: "", // when containing a valid country ("countries:...") the row's background colour will be changed to enhance visibility 
    rapidapiKey : "", // X-RapidAPI-Key provided at https://rapidapi.com/astsiatsko/api/coronavirus-monitor
    headerRowClass: "small", // small, medium or big
    infoRowClass: "big", // small, medium or big
    updateInterval: 300000, // update interval in milliseconds
    fadeSpeed: 4000, 
    timeFormat: "MMMM Do YYYY, h:mm:ss a" // April 7th 2020, 03:08:10 pm
  },

  getStyles: function() {
    return ["MMM-COVID19.css"]
  },
  
  getTranslations: function() {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
      es: "translations/es.json",
      hu: "translations/hu.json",
      pl: "translations/pl.json",
      fr: "translations/fr.json"
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
    var wrapper = document.createElement("table")
    if (Object.entries(this.countriesStats).length === 0) return wrapper
    if (Object.entries(this.globalStats).length === 0) return wrapper

    var countriesList = this.config.countries
    var countriesStats = this.countriesStats["countries_stat"]
    var globalStats = this.globalStats
    if (this.config.orderCountriesByName && countriesStats) {
		countriesStats.sort(this.compareValues('country_name', this.config.orderAscending))
    } else if (countriesStats) {
		countriesStats.sort(this.compareValues('cases', this.config.orderAscending))
	}
    
    wrapper.className = this.config.tableClass || 'covid'

    // header row
    var headerRow = document.createElement("tr"),
        headerConfirmedCell = document.createElement("td"),
        headerCasesPerMCell = document.createElement("td"),
        headerNewConfirmedCell = document.createElement("td"),
        headerCountryNameCell = document.createElement("td"),
        headerRecoveredCell = document.createElement("td"),
        headerDeathsCell = document.createElement("td"),
        headerNewDeathsCell = document.createElement("td"),
        headerSeriousCell = document.createElement("td"),
        headerActiveCell = document.createElement("td");

    headerCountryNameCell.innerHTML = ''
    headerConfirmedCell.className = 'number confirmed ' + this.config.headerRowClass
    headerConfirmedCell.innerHTML = this.translate('Confirmed')
    headerCasesPerMCell.className = 'number ' + this.config.headerRowClass
    headerCasesPerMCell.innerHTML = this.translate('Cases Per M')
    headerNewConfirmedCell.className = 'number confirmed ' + this.config.headerRowClass
    headerNewConfirmedCell.innerHTML = this.translate('New Cases')
    headerDeathsCell.className = 'number deaths ' + this.config.headerRowClass
    headerDeathsCell.innerHTML = this.translate('Deaths')
    headerNewDeathsCell.className = 'number deaths ' + this.config.headerRowClass
    headerNewDeathsCell.innerHTML = this.translate('New Deaths')
    headerSeriousCell.className = 'number serious ' + this.config.headerRowClass
    headerSeriousCell.innerHTML = this.translate('Serious')
    headerRecoveredCell.className = 'number recovered ' + this.config.headerRowClass
    headerRecoveredCell.innerHTML = this.translate('Recovered')
    headerActiveCell.className = 'number active ' + this.config.headerRowClass
    headerActiveCell.innerHTML = this.translate('Active')

    headerRow.appendChild(headerCountryNameCell)
    headerRow.appendChild(headerConfirmedCell)
    if (this.config.showExtraInfo) {
      headerRow.appendChild(headerCasesPerMCell)
    }
    if (this.config.delta) {
      headerRow.appendChild(headerNewConfirmedCell)
    }
    headerRow.appendChild(headerDeathsCell)
    if (this.config.delta) {
      headerRow.appendChild(headerNewDeathsCell)
    }
    if (this.config.showExtraInfo) {
      headerRow.appendChild(headerSeriousCell)
    }
    headerRow.appendChild(headerRecoveredCell)
    headerRow.appendChild(headerActiveCell)

    wrapper.appendChild(headerRow)
    // WorldWide row, activate it via config
    if (this.config.worldStats) {
      let worldRow = document.createElement("tr"),
          worldNameCell = document.createElement("td"),
          confirmedCell = document.createElement("td"),
          newCasesCell = document.createElement("td"),
          deathsCell = document.createElement("td"),
          newDeathsCell = document.createElement("td"),
          seriousCell = document.createElement("td"),
          recoveredCell = document.createElement("td"),
          activeCell = document.createElement("td"),
          casesPerMCell = document.createElement("td"),
          cases = globalStats["total_cases"],
          newCases = globalStats["new_cases"],
          deaths = globalStats["total_deaths"],
          newDeaths = globalStats["new_deaths"],
          totalRecovered = globalStats["total_recovered"],
          serious = this.translate('N/A'),
          casesPerM = this.translate('N/A');
          activeCases = (cases && totalRecovered)?
              this.numberWithCommas(parseInt(cases.replace(/,/g,"")) - parseInt(totalRecovered.replace(/,/g,"")) - parseInt(deaths.replace(/,/g,"")))
              :"";

      worldNameCell.innerHTML = this.translate('Worldwide')
      worldNameCell.className = this.config.infoRowClass
      worldRow.className = 'world ' + this.config.infoRowClass
      confirmedCell.className = 'number confirmed ' + this.config.infoRowClass
      confirmedCell.innerHTML = cases
      casesPerMCell.className = 'number ' + this.config.infoRowClass
      casesPerMCell.innerHTML = casesPerM
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
      seriousCell.className = 'number serious ' + this.config.infoRowClass
      seriousCell.innerHTML = serious
      recoveredCell.className = 'number recovered ' + this.config.infoRowClass
      recoveredCell.innerHTML = totalRecovered
      activeCell.className = 'number active ' + this.config.infoRowClass
      activeCell.innerHTML = activeCases

      worldRow.appendChild(worldNameCell)
      worldRow.appendChild(confirmedCell)
      if (this.config.showExtraInfo) {
        worldRow.appendChild(casesPerMCell)
      }
      if (this.config.delta) {
        worldRow.appendChild(newCasesCell)
      }
      worldRow.appendChild(deathsCell)
      if (this.config.delta) {
        worldRow.appendChild(newDeathsCell)
      }
      if (this.config.showExtraInfo) {
        worldRow.appendChild(seriousCell)
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
            casesPerMCell = document.createElement("td"),
            newCasesCell = document.createElement("td"),
            deathsCell = document.createElement("td"),
            newDeathsCell = document.createElement("td"),
            seriousCell = document.createElement("td"),
            recoveredCell = document.createElement("td"),
            activeCell = document.createElement("td"),
            countryName = value["country_name"],
            cases = value["cases"],
            deaths = value["deaths"],
            serious = value["serious_critical"],
            newCases = value["new_cases"],
            newDeaths = value["new_deaths"],
            totalRecovered = value["total_recovered"],
            activeCases = value["active_cases"],
            casesPerM = value["total_cases_per_1m_population"];

        countryNameCell.innerHTML = this.translate(countryName)
        countryNameCell.className = this.config.infoRowClass
        if (countryName === this.config.highlightCountry) {
          countryRow.className = 'highlight ' + this.config.infoRowClass
        }
        confirmedCell.className = 'number confirmed ' + this.config.infoRowClass
        confirmedCell.innerHTML = cases
        casesPerMCell.className = 'number ' + this.config.infoRowClass
        casesPerMCell.innerHTML = casesPerM
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
        seriousCell.className = 'number serious ' + this.config.infoRowClass
        seriousCell.innerHTML = serious
        recoveredCell.className = 'number recovered ' + this.config.infoRowClass
        recoveredCell.innerHTML = totalRecovered
        activeCell.className = 'number active ' + this.config.infoRowClass
        activeCell.innerHTML = activeCases

        countryRow.appendChild(countryNameCell)
        countryRow.appendChild(confirmedCell)
        if (this.config.showExtraInfo) {
          countryRow.appendChild(casesPerMCell)
        }
        if (this.config.delta) {
          countryRow.appendChild(newCasesCell)
        }
        countryRow.appendChild(deathsCell)
        if (this.config.delta) {
          countryRow.appendChild(newDeathsCell)
        }
        if (this.config.showExtraInfo) {
          countryRow.appendChild(seriousCell)
        }
        countryRow.appendChild(recoveredCell)
        countryRow.appendChild(activeCell)

        wrapper.appendChild(countryRow)
      }
    }
    if (this.config.lastUpdateInfo) {
      let statsDateRow = document.createElement("tr"),
          statsDateCell = document.createElement("td");
      // convert API date/time UTC to local timezone
      let dateToLocalTimezone = new Date(this.countriesStats['statistic_taken_at'] + ' UTC')

      statsDateCell.innerHTML = this.translate('statistic taken at ') + moment(dateToLocalTimezone).format(this.config.timeFormat) 
      if (this.config.delta && this.config.showExtraInfo) {
	      statsDateCell.colSpan = "9"
      } else if (this.config.delta || this.config.showExtraInfo) {
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
  // sort according to the key (currently country_name or cases), 
  // sort order either ascending or descending as per variable orderAscending
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
  // insert separating commas into a number at thousands, millions, etc
  numberWithCommas: function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
})
