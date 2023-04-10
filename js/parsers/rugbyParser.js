async function parseRugby() {
  let graph = null;


  await d3.csv("data/pro12_mentions.csv")
    .then(function(data) {


      let dataSet = parseRugbyTweets(data);

      graph = parseRugbyGraph(dataSet, 16, 24)
      console.log(dataSet)


    })
    .catch(function(error){
      console.log(error);
    })

  console.log(graph)
  return graph;
}


class Tweet {
  time;
  from;
  to;

  constructor(time, from, to) {
    this.time = time;
    this.from = from;
    this.to = to;

  }
}

class TweetDataSet {
  tweets = [];
  teams = new Set();
  firstTime;
  lastTime;

  constructor(tweets, teams, firstTime, lastTime) {
    this.tweets = tweets;
    this.teams = teams;
    this.firstTime = firstTime;
    this.lastTime = lastTime;
  }
}

function parseRugbyTweets(data) {
  let teams = new Set();
  let tweets = [];

  for (let i = 1; i < data.length; i++) {
    let line = data[i];
    tweets.push(new Tweet(line.date, line.tweeting_user, line.mentioned_user));
    teams.add(line.tweeting_user);
    teams.add(line.mentioned_user);
  }

  return new TweetDataSet(tweets, teams, tweets[0].time, tweets[tweets.length-1].time)
}

function parseRugbyGraph(dataSet, duration, timeSlices) {
  let graph = {};
  graph.timeslices = [];
  let halfDuration = duration / 2;
  let nodeMap = new Map();

  let intervalSize = dataSet.firstTime

  const firstTime = moment(dataSet.firstTime, 'YYYY-MM-DD HH:mm:ss')
  const lastTime = moment(dataSet.lastTime, 'YYYY-MM-DD HH:mm:ss')

  let intervalDays =  lastTime.diff(firstTime, 'days')

  let daysPerTimeslice = intervalDays / timeSlices;

  console.log(dataSet.firstTime);
  console.log(dataSet.lastTime);

  console.log(firstTime);
  console.log(lastTime);


  console.log(intervalDays)
  console.log(daysPerTimeslice)

  for(let i = 0; i < timeSlices; i++) {
    let sliceTime = firstTime.clone();
    sliceTime.add(Math.floor(daysPerTimeslice * i), 'days');

    let sliceName = firstTime.clone().add(Math.floor(daysPerTimeslice * i), 'days').format('DD-MM-YY');

    graph.timeslices.push({tag: sliceName, nodes: [], links: [], time: sliceTime});
  }

  console.log(graph)

  dataSet.teams.forEach(function (team, id) {
    let node = {name:team, group: 1, id: id};

    graph.timeslices.forEach(function (slice) {
      slice.nodes.push(node);
    });

    nodeMap.set(team, node);
  });

  dataSet.tweets.forEach(function (tweet, id) {
    let source = nodeMap.get(tweet.from).id;
    let target = nodeMap.get(tweet.to).id;
    let edge;
    if (source > target) {
      edge = {source: source, target: target, value: 1, id: id};
    } else {
      edge = {source: target, target: source, value: 1, id: id};
    }





    graph.timeslices.forEach(function (slice, sliceId) {
      let tweetTime = moment(tweet.time, 'YYYY-MM-DD HH:mm:ss');

      let sliceIntervalStart = slice.time.clone().subtract(duration, 'days');
      let sliceIntervalEnd = slice.time.clone().add(duration, 'days');




      if(tweetTime.isBetween(sliceIntervalStart, sliceIntervalEnd) && !isLinkInTimeSlice(source, target, slice.links)) {
        slice.links.push(edge);
      }
    });

  });

  return graph;
}

function isLinkInTimeSlice(source, target, links) {
  let exists = false;

  links.forEach(function (link, i) {
    if(link.source === source && link.target === target || link.source === target && link.target === source) {
      exists = true;
    }
  });

  return exists;
}

/*

function isLinkInTimeSlice(id, graph, sliceId) {
  let timeSlice = graph.timeslices[sliceId];
  let exists = false;

  timeSlice.links.forEach(function (link, i) {
    if(link.id === id) {
      exists = true;
    }
  });

  return exists;
}

function reverseLinkExists(source, target, links) {
  let exists = false;

  links.forEach(function (link, i) {
    if(link.source.id === target.id && link.target.id === source.id) {
      exists = true;
    }
  });

  return exists;
}

*/
