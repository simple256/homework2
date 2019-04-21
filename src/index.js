import "babel-polyfill";
import Chart from "chart.js";

const meteoURL = "/xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadForecast(){
  const response = await fetch(meteoURL);
  const xmlTest = await response.text();
  const parser = new DOMParser();
  let forecastData = parser.parseFromString(xmlTest, "text/xml");
  forecastData = forecastData.getElementsByTagName("FORECAST");
  const result = Object.create(null);

  for (let i = 0; i < forecastData.length; i++) {
    result[i] = new Object();
    result[i].date = new Date(
      forecastData[i].getAttribute("year"),
      forecastData[i].getAttribute("month")-1,
      forecastData[i].getAttribute("day"),
      forecastData[i].getAttribute("hour")
    );

    result[i].dates = forecastData[i].getAttribute("day") + "." + forecastData[i].getAttribute("month") + "." + forecastData[i].getAttribute("year").slice(-2) + " " + forecastData[i].getAttribute("hour")+":00";

    let temperatureMin = Number(forecastData[i].children[2].getAttribute("min"));
    let temperatureMax = Number(forecastData[i].children[2].getAttribute("max"));
    let heatMin = Number(forecastData[i].children[5].getAttribute("min"));
    let heatMax = Number(forecastData[i].children[5].getAttribute("max"));

    result[i].temperature = (temperatureMin + temperatureMax) / 2;
    result[i].heat = (heatMin + heatMax) / 2;
  }

  return result;
}



const buttonBuild = document.getElementById("btn");
const canvasCtx = document.getElementById("out").getContext("2d");
let forecastData;
buttonBuild.addEventListener("click", async function() {
  forecastData = await loadForecast();
  const keys = Object.keys(forecastData).sort((k1, k2) =>
    compare(forecastData[k1].date, forecastData[k2].date)
  );
  const plotTemperatureData = keys.map(key => forecastData[key].temperature);
  const plotHeatData = keys.map(key => forecastData[key].heat);
  const dates = keys.map(key => forecastData[key].dates);


  function checkTemp()
  {
    if (forecastData[0].temperature<forecastData[0].heat)
    return [
      {
        label: "Температура",
        type: "line",
        borderColor: "rgb(14, 108, 232)",
        backgroundColor: "rgb(255, 255, 20)",
        datasetFill:false,
        data: plotTemperatureData
      },
      {
        borderColor: "rgb(128, 5, 100)",
        backgroundColor: "rgb(255, 20, 20)",
        label: "Температура по ощущениям",
        type: "line",
        datasetFill:false,
        data: plotHeatData
      }
    ]
    else
    return [
      {
        borderColor: "rgb(128, 5, 100)",
        backgroundColor: "rgb(255, 20, 20)",
        label: "Температура по ощущениям",
        type: "line",
        datasetFill:false,
        data: plotHeatData
      },
      {
        label: "Температура",
        type: "line",
        borderColor: "rgb(14, 108, 232)",
        backgroundColor: "rgb(255, 255, 20)",
        datasetFill:false,
        data: plotTemperatureData
      }
    ]
  };
  
  const chartConfig = {
    type: "line",

    data: {
      labels: dates,
      datasets: checkTemp()
    }
  };

  if (window.chart) {
    chart.data.labels = chartConfig.data.labels;
    chart.data.datasets[0].data = chartConfig.data.datasets[0].data;
    chart.update({
      duration: 800,
      easing: "easeOutBounce"
    });
  }else {
    window.chart = new Chart(canvasCtx, chartConfig);
  }
});

function compare(a, b) {
  if (+a > +b) return 1;
  if (+a < +b) return -1;
  return 0;
}
