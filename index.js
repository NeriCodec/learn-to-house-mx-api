var express = require("express");
var app = express();
var scrapeIt = require("scrape-it");

var port = process.env.PORT || 3000;

app.get("/", function (req, res) {
  res.status(200).send({
    status: "ok",
    data: {},
  });
});

app.get("/get-calendar", async (req, res) => {
  try {
    var calendar = await getCalendar(req.query.url);
    var schedule = await getSchedule(req.query.url);

    res.status(200).send({
      status: "ok",
      data: {
        calendar,
        schedule,
      },
    });
  } catch (error) {
    res.status(500).send({ status: "error", data: error });
  }
});

app.get("/get-subjects", async (req, res) => {
  try {
    var data = await getTopicsBySubjects(req.query.url);
    var books = await getBooks(req.query.url);

    res.status(200).send({
      status: "ok",
      data,
      books,
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
    var document = await getDocumentLink(req.query.url, req.query.asignature);

    res.status(200).send({
      status: "ok",
      data,
      document,
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
        day: {
          selector: "div h4",
          eq: 0,
        },
        month: {
          selector: "div h4",
          eq: 1,
        },
        number: "div h2",
      },
    },
  });

  return scrapeResult.data.info;
}

async function getSchedule(url) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: ".container .row div.col-lg-12.col-md-12.col-sm-12.col-xs-12",
      data: {
        link: {
          selector: "img",
          attr: "data-src",
        },
      },
    },
  });

  var filterEmpty = scrapeResult.data.info.filter(function (subject) {
    return subject.link !== "";
  });

  return filterEmpty;
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

async function getBooks(url) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: ".carousel-inner",
      data: {
        img: {
          selector: "img",
          attr: "data-src",
        },
        title: {
          selector: "img",
          attr: "title",
        },
        book: {
          selector: "a",
          attr: "href",
        },
      },
    },
  });

  return scrapeResult.data.info;
}

async function getMaterial(url, id) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: `#${id}`,
      data: {
        title: "h3",
        summary1: ".hoja",
        summary2: `#${id} .row`,
      },
    },
  });

  const regex = /\r?\n|\r/g;

  if (scrapeResult.data.info[0].summary1 === "") {
    return {
      description: scrapeResult.data.info[0].summary2.replace(regex, "\n"),
      title: "",
    };
  }

  return {
    description: scrapeResult.data.info[0].summary1.replace(regex, "\n"),
    title: scrapeResult.data.info[0].title,
  };
}

async function getDocumentLink(url, id) {
  const scrapeResult = await scrapeIt(url, {
    info: {
      listItem: `#${id} strong`,
      data: {
        link: {
          selector: "a",
          attr: "href",
        },
      },
    },
  });

  if (scrapeResult.data.info.length === 0) {
    const scrapeResult1 = await scrapeIt(url, {
      info: {
        listItem: `#${id} .video`,
        data: {
          link: {
            selector: "a",
            attr: "href",
          },
        },
      },
    });

    var filterEmpty = scrapeResult1.data.info.filter(function (item) {
      return item.link !== "";
    });

    return filterEmpty;
  }

  var filterEmpty = scrapeResult.data.info.filter(function (item) {
    return item.link !== "";
  });

  return filterEmpty;
}

app.listen(port, () => {});
