$(function() {

    //REPLACE DEVICE UNIQUE IDENTIFIER / SERIAL NUMBER HERE
    var myDevice = '000001'; //default unique device identifier

    //REPLACE WITH FULL APP DOMAIN IF RUNNING LOCALLY, OTHEWISE LEAVE AS "/"
    var app_domain = '/';

    var data = [];
    var updateInterval = 1000; //milliseconds
    var timeWindow = 10; //minutes

    var red_color = '#6B0023';

    var graph_options = {
        series: {
            lines: { show: true, lineWidth: 1.5, fill: 0.1 },
            points: { show: true, radius: 0.7, fillColor: "#41C4DC" }
        },
        legend: {
            position: "nw",
            backgroundColor: "#111111",
            backgroundOpacity: 0.8
        },
        /*yaxis: {
          min: 0,
          max: 100
        },*/
        xaxis: {
            mode: "time",
            timeformat: "%I:%M %p",
            timezone: "browser"
        },
        colors: ["#2C9DB6", "#FF921E", "#FF5847", "#FFC647", "#5D409C", "#BF427B", "#D5E04D"]
    };

    $("#specificdevice").text(myDevice);
    $("#currentdevice").text(myDevice);
    $("#appstatus").text('Running');
    $("#appstatus").css('color', '555555');
    $("#appconsole").text('starting...');
    $("#appconsole").css('color', '#555555');
    $("#placeholder").text('Graph: Retrieving Data Now....');

    function fetchData() {
        console.log('fetching data from Murano');
        $("#appconsole").text('Fetching Data For ' + myDevice + ' From Server...');
        $("#appconsole").css('color', '#555555');

        function onDataReceived(newdata) {
            $("#appstatus").text('Running');
            $("#appstatus").css('color', '555555');
            $("#appconsole").text('Processing Data');
            $("#appconsole").css('color', '#555555');
            var data_to_plot = [];
            // Load all the data in one pass; if we only got partial
            // data we could merge it with what we already have.
            //console.log(series)
            console.log(newdata);

            if (newdata.timeseries.status == 'Bad request') {
                //Database error
                console.log(newdata.status)
                $("#appconsole").text(newdata.status);
                $("#appconsole").css('color', red_color);
                $("#placeholder").text('Graph: Data Not Available for: ' + myDevice);
            } else if (newdata.timeseries.error) {
                //Database error
                console.log(newdata.timeseries.error)
                $("#appconsole").text(newdata.timeseries.error);
                $("#appconsole").css('color', red_color);
                $("#placeholder").text('Graph: Data Not Available for: ' + myDevice);
            } else if (newdata.timeseries.results[0].error) {
                //Database error
                console.log('recevied database error response')
                $("#appconsole").text('Server Time Series Database Error');
                $("#appconsole").css('color', red_color);
                $("#placeholder").text('Graph: Data Not Available for: ' + myDevice);
            } else if (jQuery.isEmptyObject(newdata.timeseries.results[0])) {
                //Database error
                console.log('no valid data in db, check device')
                $("#appconsole").text('No data for this device');
                $("#placeholder").text('Graph: Data Not Available for: ' + myDevice);
            } else {
                console.log('valid data return for: ' + myDevice);
                for (j = 0; j < newdata.timeseries.results[0].series.length; j++) {
                    var data = newdata.timeseries.results[0].series[j].values;
                    var friendly = newdata.timeseries.results[0].series[j].name;
                    var units = "";
                    var last_val = newdata.timeseries.results[0].series[j].values[data.length - 1][1];
                    if (friendly == "temperature") {
                        units = "F";
                        friendly = "Temperature";
                    } else if (friendly == "humidity") {
                        units = "%";
                        friendly = "Humidity";
                    }
                    data_to_plot.push({
                        label: friendly + ' - ' + last_val + ' ' + units,
                        data: data,
                        units: "F"
                    });
                }
                $("#placeholder").text('');
                $.plot("#placeholder", data_to_plot, graph_options);
                $("#appconsole").text('Data Plotted');
                $("#appconsole").css('color', '#555555');
            }
            if (updateInterval != 0) {
                setTimeout(fetchData, updateInterval);
            }
        }

        function onError(jqXHR, textStatus, errorThrown) {
            console.log('error: ' + textStatus + ',' + errorThrown);
            $("#appconsole").text('No Server Response');
            $("#appstatus").text('Server Offline');
            $("#appstatus").css('color', red_color);
            if (updateInterval != 0) {
                setTimeout(fetchData, updateInterval + 3000);
            }
        }

        $.ajax({
            url: app_domain + "development/device/data/" + myDevice + "/" + timeWindow,
            type: "GET",
            dataType: "json",
            success: onDataReceived,
            crossDomain: true,
            error: onError,
            statusCode: {
                504: function() {
                    console.log("server not responding");
                    $("#appstatus").text('Server Not Responding 504');
                    $("#appstatus").css('color', red_color);
                }
            },
            timeout: 10000
        });
    }


    // Set up the control widget

    $("#updateInterval").val(updateInterval).change(function() {
        var v = $(this).val();
        if (v && !isNaN(+v)) {
            if (updateInterval == 0) {
                setTimeout(fetchData, 1000);
            } //updates were turned off, start again
            updateInterval = +v;
            if (updateInterval > 20000) {
                updateInterval = 20000;
            }
            $(this).val("" + updateInterval);

        }
    });

    $("#timeWindow").val(timeWindow).change(function() {
        var v = $(this).val();
        if (v && !isNaN(+v)) {
            timeWindow = +v;
            if (timeWindow < 1) {
                timeWindow = 1;
            } else if (timeWindow > 360) {
                timeWindow = 360;
            }
            $(this).val("" + timeWindow);
        }
    });

    $("#specificdevice").val(myDevice).change(function() {
        var v = $(this).val();
        if (v) {
            myDevice = v;
            console.log('new device identity:' + myDevice);
            $(this).val("" + myDevice);
            $("#currentdevice").text(myDevice);
            $("#placeholder").text('Graph: Retrieving New Device Data Now....');
        }
    });

    fetchData();

    $("#footer").prepend("Exosite Murano Example");
});
