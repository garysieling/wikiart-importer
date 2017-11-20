const fs = require('fs');
const _ = require('lodash');

const root = '../wikiart/wikiart/meta/';
const files = fs.readdirSync(root);

const colorData = 
  _.fromPairs(
    fs.readFileSync('../log.txt', 'utf-8').split("\n").map(
      (line) => line.split(',')
    )
  );
  //console.log(JSON.stringify(colorData, null, 2));

function addYear(solrReady, prefix) {
  const year = solrReady[prefix + '_s'].split(' ').filter(
    (x) => x.match(/^\d\d\d\d$/)
  );

  if (year.length > 0) {
    solrReady[prefix + 'Year_s'] = year[0];
    solrReady[prefix + 'Decade_s'] = year[0].substring(0,3) + '0s';
    solrReady[prefix + 'Century_s'] = year[0].substring(0,2) + '00s';
  }
}

function featureDetect(v, key, object) {
  if (key === 'url') {
    return 'id';
  }

  if (_.isNumber(v)) {
    return key + "_i";
  } else if (_.isString(v)) {
    return key + "_s";
  } else if (_.isArray(v)) {
    if (_.isNumber(v[0])) {
      return key + "_ii";
    } else if (_.isString(v[0])) {
      return key + "_ss";
    } else {
      throw v;
    }
  } else {
    throw v;
  }
}

let batch = [];
i = 0;
let total = 0;
files.filter(
  (file) => file.endsWith('.json')
).map(
  (file) => {
    const text = fs.readFileSync(root + file);
    const data = JSON.parse(text);

    data.filter(
      (work) => !!work.contentId
    ).map(
      (work) => {
        const noNulls = _.omitBy(work, _.isEmpty);
        const solrReady = _.mapKeys(noNulls, featureDetect);

        if (solrReady['deathDayAsString_s']) {
          addYear(solrReady, 'deathDayAsString');  
        }

        if (solrReady['birthDayAsString_s']) {
          addYear(solrReady, 'birthDayAsString');  
        }

        if (solrReady['completionYear_s']) {
          const year = solrReady['completionYear_s'] + '';
          solrReady['completionDecade_s'] = year.substring(0,3) + '0s';
          solrReady['completionCentury_s'] = year.substring(0,2) + '00s';      
        }
        

        if (solrReady['yearAsString_s']) {
          const year = solrReady['yearAsString_s'] + '';
          solrReady['yearDecade_s'] = year.substring(0,3) + '0s';
          solrReady['yearCentury_s'] = year.substring(0,2) + '00s';      
        }

        const image = (work.contentId) + '.jpg';
        
        if (colorData[image]) {
          solrReady['colors_ss'] = colorData[image];
        }

        batch.push(solrReady);
        total++;
        if (batch.length >= 50000) {
          fs.writeFileSync('data/' + (i++) + '.json', JSON.stringify(batch, null, 2));
          batch = [];
        }
      }
    )
  }
);

fs.writeFileSync('data/' + (i++) + '.json', JSON.stringify(batch, null, 2));
batch = [];

console.log(total);
