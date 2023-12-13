var ticker = JSON.parse(localStorage.getItem('ticker')) || [];
var lastprice = {};
var counter = 5;

function startupdate(){
    updatePrice();
    countdown = setInterval(function () {
        counter--;
        $('#counter').text(counter);
        if (counter <= 0) {
            updatePrice();
            counter = 5;
        }
    }, 1000)
}

$(document).ready(function (){
    ticker.forEach(function(ticker) {
        addTickerToGrid(ticker);
    });
    updatePrice();
    $('#add-ticker').submit(function(e){
        e.preventDefault();
        var newTick = $('#new-tick').val().toUpperCase();
        if (!ticker.includes(newTick)) {
            ticker.push(newTick);
            localStorage.setItem('ticker', JSON.stringify(ticker))
            addTickerToGrid(newTick);
        }
        $('#new-tick').val('');
        updatePrice();
    })
    $('#ticker-grid').on('click', '.remove-btn', function () {
        var tickerToRemove = $(this).data('ticker');
        ticker = ticker.filter(t => t !== tickerToRemove);
        localStorage.setItem('ticker', JSON.stringify(ticker))
        $(`#${tickerToRemove}`).remove();
    });
    startupdate();
});

function addTickerToGrid(ticker){
    $('#ticker-grid').append(`
        <div id="${ticker}" class="stock-box">
            <div class="ticker-header">
                <h2>${ticker}</h2>
                <button class="remove-btn" data-ticker="${ticker}">Remove</button>
            </div>
            <p id="${ticker}-price"></p>
            <p id="${ticker}-pct"></p>
            <div id="${ticker}-chart-container">
                <canvas id="${ticker}-chart"></canvas>
            </div>
        </div>
    `);
}

function updatePrice(){
    ticker.forEach(function (ticker) {
        $.ajax({
            url: '/stonks',
            type: 'POST',
            data: JSON.stringify({'ticker': ticker}),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function(data) {
                var changePercent = ((data.currentPrice - data.openPrice) / data.openPrice) * 100
                var colorClass;
                if (changePercent <= -2) {
                    colorClass = 'dark-red'
                } else if (changePercent < 0){
                    colorClass = 'red'
                } else if (changePercent == 0){
                    colorClass = 'gray'
                } else {
                    colorClass = 'dark-green'
                }

                $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`);
                $(`#${ticker}-pct`).text(`${changePercent.toFixed(2)}%`);
                $(`#${ticker}-price`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
                $(`#${ticker}-pct`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
           
                var flashClass;
                if (lastprice[ticker] > data.currentPrice) {
                    flashClass = 'red-flash';
                } else if (lastprice[ticker] < data.currentPrice) {
                    flashClass = 'green-flash';
                } else {
                    flashClass = 'gray-flash';
                }
                lastprice[ticker] = data.currentPrice;
                $(`#${ticker}`).addClass(flashClass);
                setTimeout(function() {
                    $(`#${ticker}`).removeClass(flashClass);
                }, 1000);

                // Remove the old canvas and create a new one
                $(`#${ticker}-chart`).remove();
                $(`#${ticker}-chart-container`).append(`<canvas id="${ticker}-chart"></canvas>`);
                var ctx = document.getElementById(ticker + '-chart').getContext('2d');
                var labels = data.timestamps.map(t => new Date(t * 1000));

                window.myChart = window.myChart || {};
                window.myChart[ticker] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Stock Price',
                            data: data.intradayData,
                            // backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            // borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderColor: 'rgba(255, 255, 255, 1)',
                            borderWidth: 1,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'minute',
                                    displayFormats: {
                                        minute: 'HH:mm'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            }
        });
    });
}