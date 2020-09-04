const express = require("express");
const app = express();
const scrapeIt = require("scrape-it");

const port = process.env.PORT || 3000;

app.get("/get-calendar", async (req, res) => {
  try {
    var calendar = await getCalendar(req.query.url);

    res.status(200).send({
      status: "ok",
      data: calendar,
    });
  } catch (error) {
    res.status(500).send({ status: "error", data: error });
  }
});

app.get("/get-subjects", async (req, res) => {
  try {
    var data = await getTopicsBySubjects(req.query.url);

    res.status(200).send({
      status: "ok",
      data,
    });
  } catch (error) {
    res.status(500).send({ status: "error", data: error });
  }
});

app.get("/get-material-youtube", async (req, res) => {
  try {
    var data = await getYoutubeLinks(req.query.url, req.query.asignature);

    res.status(200).send({
      status: "ok",
      data,
    });
  } catch (error) {
    res.status(500).send({ status: "error", data: error });
  }
});

app.get("/get-material", async (req, res) => {
  try {
    var data = await getMaterial(req.query.url, req.query.asignature);

    res.status(200).send({
      status: "ok",
      data,
    });
  } catch (error) {
    res.status(500).send({ status: "error", data: error });
  }
});

async function getCalendar(url) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: "#original-cal div .dia_fch",
      data: {
        link: {
          selector: "a",
          attr: "href",
        },
        day: "div h4",
        number: "div h2",
      },
    },
  });

  return scrapeResult.data;
}

async function getTopicsBySubjects(url) {
  const subjects = await scrapeIt(url, {
    info: {
      listItem: ".row div",
      data: {
        url: {
          selector: "img",
          attr: "data-src",
        },
        id: {
          selector: "img",
          attr: "onclick",
          convert: (x) => x.split("'")[1],
        },
      },
    },
  });

  var filtered = subjects.data.info.filter(function (subject) {
    return typeof subject.id !== "undefined";
  });

  return filtered;
}

async function getYoutubeLinks(url, id) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: `#${id} div div p`,
      data: {
        link: {
          selector: "a",
          attr: "href",
        },
      },
    },
  });

  var filterEmpty = scrapeResult.data.info.filter(function (subject) {
    return subject.link !== "";
  });

  var fileterUrl = filterEmpty.filter(function (subject) {
    var context = String(subject.link).substr(0, 5);

    return context == "https" || context == "http";
  });

  var filterYT = fileterUrl.filter(function (subject) {
    return ytVidId(subject.link);
  });

  return filterYT;
}

/**
 * JavaScript function to match (and return) the video Id
 * of any valid Youtube Url, given as input string.
 * @author: Stephan Schmitz <eyecatchup@gmail.com>
 * @url: https://stackoverflow.com/a/10315969/624466
 */
function ytVidId(url) {
  var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  return url.match(p) ? RegExp.$1 : false;
}

async function getMaterial(url, id) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: `#${id}`,
      data: {
        title: "h3",
        summary: ".hoja",
      },
    },
  });

  const regex = /\r?\n|\r/g;

  var description = scrapeResult.data.info[0].summary.replace(regex, "");

  return description;
}

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
