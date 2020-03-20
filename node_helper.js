/* global module */

/* Magic Mirror
 * Node Helper: MMM-COVID19
 *
 * By Jose Forte
 * MIT Licensed.
 */

var NodeHelper = require('node_helper')
var request = require('request')

module.exports = NodeHelper.create({
  start: function () {
    console.log('Starting node helper for: ' + this.name)
  },

  getInfo: function(key) {
    var self = this
    var options = {
      method: 'GET',
      url: 'https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_country.php',
      headers: {
        'x-rapidapi-host': 'coronavirus-monitor.p.rapidapi.com',
        'x-rapidapi-key': key
      }
    }
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body)        
        self.sendSocketNotification('INFO_RESULT', result)
      }
    })
  },
  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GET_INFO') {
      this.getInfo(payload)
    }
  }
  
});
