// Update the file path to the local JSON file
const sector_url = "http://127.0.0.1:5000/api/v1.0/Four%20Sector%20Stocks";

// Fetch the JSON data and console log it
d3.json(sector_url).then(function(data) {
  console.log(data);
});

// Fetch the latest news headlines and summaries for the selected stock
function fetchNews(stock) {
  const apiKey = "Paste The API_Key From The api_keys.py file";
  const newsUrl = `https://api.marketaux.com/v1/news/all?symbols=${stock}&filter_entities=true&language=en&sentiment=positive&api_token=${apiKey}`;
  console.log(newsUrl);

  fetch(newsUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch news.");
      }
      return response.json();
    })
    .then(data => {
      const articles = data.data.slice(0, 6); // Get the latest 6 articles

      // Display the news headlines, summaries, and URLs
      const newsTable = d3.select("#news-table");
      newsTable.html(""); // Clear previous content
      newsTable.style("border-collapse", "collapse"); // Add border-collapse style

      const tableHeader = newsTable.append("tr");
      tableHeader.append("th").text("Headline");
      tableHeader.append("th").text("Summary");
      tableHeader.append("th").text("Link");

      articles.forEach(article => {
        const headline = article.title;
        const summary = article.description;
        const url = article.url;

        const tableRow = newsTable.append("tr");
        tableRow.append("td").text(headline);
        tableRow.append("td").text(summary);
        tableRow.append("td").html(`<a href="${url}" target="_blank">Read Article</a>`);
      });
    })
    .catch(error => {
      console.log(error);
      const newsTable = d3.select("#news-table");
      newsTable.html(""); // Clear previous content
      newsTable.append("tr").append("td").text("Failed to fetch news.");
    });
}


// Starting the dashboard at opening the index up
function init() {
  // Use D3 to select the dropdown menu
  let dropdownMenu = d3.select("#selDataset");

  // Use D3 to get sample names and populate the drop-down selector
  d3.json(sector_url).then((data) => {
    // Set a variable for the sample names
    let names = data.names;

    // Filter stock symbols to only include "AAPL", "AMZN", "NFLX", "GOOG", "GOOGL", and "FB"
    let filteredNames = names.filter((Stock_symbol) =>
      ["AAPL", "AMZN", "NFLX", "GOOG", "GOOGL", "FB"].includes(Stock_symbol)
    );

    // Add filtered stocks to dropdown menu and log the value of stock symbol for each iteration of the loop
    filteredNames.forEach((Stock_symbol) => {
      // console.log(Stock_symbol);
      dropdownMenu.append("option").text(Stock_symbol).property("value", Stock_symbol);
    });

    // Set the first sample from the list and log the value of starting stock
    let startingstock = filteredNames[0];
    // console.log(startingstock);

    // Build the initial plots
    t_test_bar(startingstock);
    trade_bar(startingstock);
    pieChart(startingstock);
    barChart(startingstock);

    // Fetch news for the initial stock
    // fetchNews(startingstock);
  });
}

// Function that builds the line chart
function barChart(stock) {
  // Use D3 to retrieve all of the data
  d3.json(sector_url).then((data) => {
    // Retrieve all sample data
    let stockData = data.metadata;
    // Filter based on the value of the stock
    let value = stockData.filter(result => result.Stock_symbol == stock)[0];
    // Get the opening and closing price
    let { start_price, end_price, pct_change } = value;
    // Log the data to the console
    // console.log(start_price, end_price, pct_change);

    // Set up the trace for the bar chart
    let trace1 = {
      x: ['Opening', 'Closing'],
      y: [start_price, end_price],
      type: "bar",
      marker: {
        color: ["#B3C100", "#CED2CC"] // Earth tone colors for bars
      },
      name: "Price"
    };

    // Set up the trace for the pct_change line chart with trendline
    let trace2 = {
      x: ['Opening', 'Closing'],
      y: [pct_change],
      type: "scatter",
      mode: "lines+markers",
      yaxis: 'y2',
      name: "Percent Change",
      line: {
        shape: 'spline',
        color: "#23282D" // Earth tone color for the line
      }
    };

    // Setup the layout
    let layout = {
      title: `${stock} Stock Opening and Closing Prices`,
      xaxis: {
        title: "Date",
        ticktext: ['Opening', 'Closing'],
        tickvals: [0, 1]
      },
      yaxis: {
        title: "Price"
      },
      yaxis2: {
        title: "Percent Change",
        overlaying: 'y',
        side: 'right'
      }
    };

    // Call Plotly to plot the bar chart with the pct_change line chart
    Plotly.newPlot("bar", [trace1, trace2], layout);
  });
}

// Function that builds the pie chart
function pieChart(stock) {
  // Use D3 to retrieve all of the data
  d3.json(sector_url).then((data) => {
    // Retrieve all sample data
    let stockData = data.metadata;
    // Filter based on the value of the stock
    let selectedStock = stockData.filter(result => result.Stock_symbol === stock)[0];
    // Get the trade dollar volume of the selected stock
    let selectedStockVolume = selectedStock.trade_dollar_volume;

    // Filter out the selected stock from each GICS_Sector and calculate the total trade dollar volume for each sector
    let sectorVolumes = {};
    stockData.forEach((result) => {
      if (result.Stock_symbol !== stock) {
        let sector = result.GICS_Sector;
        if (sector in sectorVolumes) {
          sectorVolumes[sector] += result.trade_dollar_volume;
        } else {
          sectorVolumes[sector] = result.trade_dollar_volume;
        }
      }
    });

    // Add the selected stock's trade volume to the sector volumes
    sectorVolumes[`${stock} (Selected Stock)`] = selectedStockVolume;

    // Prepare data for the pie chart
    let labels = Object.keys(sectorVolumes);
    let values = Object.values(sectorVolumes);

    // Set up the trace for the pie chart
    let trace = {
      labels: labels,
      values: values,
      type: "pie",
      marker: {
        colors: ["#E2725B","#A3B18A", "#C45E2B", "#E8D6AC", "#6B6D51"]// Earth tone colors for pie slices
      }
    };

    // Setup the layout
    let layout = {
      title: `Dollar Volume traded: ${stock} vs GICS Sector during period`
    };

    // Call Plotly to plot the pie chart
    Plotly.newPlot("pie", [trace], layout);
  });
}

// Function that builds the line chart
function t_test_bar(stock) {
  
  const t_test_url = "http://127.0.0.1:5000/api/v1.0/T-Test";
  
  // Use D3 to retrieve all of the data
  d3.json(t_test_url).then((data) => {
    
    // Retrieve all sample data and Filter based on the value of the stock
    const filteredData = data.metadata.filter(result => result.Stock_symbol === stock);
    
    const sectors = filteredData.map(item => item.GICS_Sector);
    const pValues = filteredData.map(item => item.p_value);
    
    // Set up the trace for the bar chart
    let trace_p = {
      x: sectors,
      y: pValues,
      type: "bar",
      marker: {
        color: ["#E2725B","#A3B18A", "#C45E2B", "#E8D6AC", "#6B6D51" ]
      },
      name: "p-Values",
    };

    // Set up the trace for the pct_change line chart with trendline
    let trace_p2 = {
      x: sectors,
      y: new Array(sectors.length).fill(0.05),
      type: "line",
          name: "p-Value threshold",
      line: {
        color: "red",
      },
    };

    // let trace_p_data = [trace_p];
    // let trace_p_yValue = [trace_p2];

    // Setup the layout
    let layout_p = {
      title: `p-Values: ${stock} vs GICS Sector`,
      xaxis: {
        title: "GICS Sector",
        tickfont: {
          size: 10, // Adjust the font size for x-labels
        },
        automargin: true, // Automatically adjust the margin to fit the labels
        tickangle: -45, // Adjust the rotation angle for x-labels
      },
      yaxis: {
        title: "p-value",
        range: [0, 0.1], // Set the range of y-axis, with 0.1 as the maximum value
      },
    };

    // Call Plotly to plot the bar chart with the pct_change line chart
    Plotly.newPlot("t_test_bar", [trace_p, trace_p2], layout_p);
  });
}

// Function that builds the pie chart
function trade_bar(stock) {
  // Use D3 to retrieve all of the data
  d3.json(sector_url).then((data) => {
    // Retrieve all sample data
    let stockData = data.metadata;
    // Filter based on the value of the stock
    let selectedStock = stockData.filter(result => result.Stock_symbol === stock)[0];
    // Get the trade dollar volume of the selected stock
    let selectedStockPct = selectedStock.pct_change;

    // Filter out the selected stock from each GICS_Sector and calculate the total trade dollar volume for each sector
    let sectorPct = {};
    let sectorCount = {}

    stockData.forEach((result) => {
      if (result.Stock_symbol !== stock) {
        let sector = result.GICS_Sector;
        let pctChange = result.pct_change;

        if (sector in sectorPct) {
          sectorPct[sector] += pctChange;
          sectorCount[sector] += 1;
        } else {
          sectorPct[sector] = pctChange;
          sectorCount[sector] = 1;
        }
      }
    });

    for (let sector in sectorPct) {
      sectorPct[sector] /= sectorCount[sector];
    }

    // Add the selected stock's trade volume to the sector volumes
    sectorPct[`${stock} (Selected Stock)`] = selectedStockPct;

    // Prepare data for the pie chart
    let labels = Object.keys(sectorPct);
    let values = Object.values(sectorPct);

    // Set up the trace for the pie chart
    let trace_pct = {
      x: labels,
      y: values,
      type: "bar",
      marker: {
        color: ["#E2725B","#A3B18A", "#C45E2B", "#E8D6AC", "#6B6D51" ] // Earth tone colors for pie slices
      }
    };

    // Setup the layout
    let layout_pct= {
      title: `Percentage stock movement: ${stock} vs GICS Sector during period`,
      xaxis: {
        title: "GICS Sector",
        tickfont: {
          size: 10 // Adjust the font size for x-labels
        },
        automargin: true, // Automatically adjust the margin to fit the labels
        tickangle: -45 // Adjust the rotation angle for x-labels
      },
      yaxis: {
        title: "Combined Sector percentage change"
      },
    };

    // Call Plotly to plot the pie chart
    Plotly.newPlot("trade_bar", [trace_pct], layout_pct);
  });
}


// Fetching the daily stock 
// function fetchCurrentStock(stock) {
//   const apiKey = "Paste The API_Key From The api_keys.py file";
//   const alphaStockUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY_EXTENDED&symbol=${stock}&interval=15min&slice=year1month2&apikey=${apiKey}`;
//   console.log(alphaStockUrl);

//   const {StringStream} = require("scramjet");
//   const request = require("request");

//   request.get(alphaStockUrl)
//     .pipe(new StringStream())
//     .CSVParse()                                   // parse CSV output into row objects
//     .consume(object => console.log("Row:", object))
//     .then(() => console.log("success"));


// }

// Function that updates dashboard when sample is changed
function optionChanged(value) {
  // Log the new value
  console.log(value);
  // Call all functions
  t_test_bar(value);
  trade_bar(value);
  pieChart(value);
  barChart(value);
  // Fetch news for the selected stock
  fetchNews(value);
  // fetchCurrentStock(value)
}

// Call the initialize function
init();
