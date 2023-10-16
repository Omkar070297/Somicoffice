// Import required packages
const express = require('express');
const { Client } = require('azure-iot-device');
const { Mqtt } = require('azure-iot-device-mqtt');
const Chart = require('chart.js');

// Create an Express app
const app = express();
app.use(express.static('public'));

// Create an array to store sensor data
const sensorData = [];

// Set up Azure IoT Hub connection for each device
const devices = [
  {
    deviceId: 'ESP32_01',
    connectionString: 'HostName=percept02-iothub-khdf4q.azure-devices.net;DeviceId=ESP32_01;SharedAccessKey=vErM1zaRveXjZbDjaGlnHnxV6JcyNANEY9YCHMgrW4k='
  },
  {
    deviceId: 'ESP32_02',
    connectionString: 'HostName=percept02-iothub-khdf4q.azure-devices.net;DeviceId=ESP32_02;SharedAccessKey=IXDvXwOTxeH1VJuqRVD60IcHHqULUHMYv5FNX/SoFsw='
  },
  // Repeat for device 3 and 4
];

devices.forEach((device) => {
  // Create an IoT Hub client for each device
  const client = Client.fromConnectionString(device.connectionString, Mqtt);

  // Open the connection to the device
  client.open((err) => {
    if (err) {
      console.error(`Error opening device connection for ${device.deviceId}: ${err}`);
    } else {
      console.log(`Device connection established for ${device.deviceId}`);

      // Start receiving events from the device
      client.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.data.toString());
          console.log(`Received telemetry from ${device.deviceId}:`, data);

          // Save the sensor data
          sensorData.push({
            deviceId: device.deviceId,
            temperature: data.temperature,
            humidity: data.humidity,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Error processing message from ${device.deviceId}: ${error}`);
        }
      });

      // Start the device to send events to the IoT Hub
      client.on('open', () => {
        setInterval(() => {
          const message = new Message(JSON.stringify({
            temperature: Math.random() * 100,
            humidity: Math.random() * 100
          }));
          client.sendEvent(message, (err, res) => {
            if (err) {
              console.error(`Error sending telemetry to ${device.deviceId}: ${err}`);
            } else {
              console.log(`Telemetry sent to ${device.deviceId}`);
            }
          });
        }, 5000);
      });
    }
  });
});

// Set up the Express app to display the chart
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start the web server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Web app running on http://localhost:${port}`);
});