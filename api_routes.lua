--#ENDPOINT GET /development/test
return 'Hello World! \r\nI am a test Murano Solution API Route entpoint'

--#ENDPOINT GET /development/storage/keyvalue/{identifier}
-- Description: Show current key-value data for a specific unique device or for full solution
-- Parameters: ?identifier=<uniqueidentifier>
local identifier = tostring(request.parameters.identifier)

if identifier == 'all' or identifier == "nil" then
  local response_text = 'Getting Key Value Raw Data for: Full Solution: \r\n'
  local resp = Keystore.list()
  --response_text = response_text..'Solution Keys\r\n'..to_json(resp)..'\r\n'
  if resp['keys'] ~= nil then
    local num_keys = #resp['keys']
    local n = 1 --remember Lua Tables start at 1.
    while n <= num_keys do
      local id = resp['keys'][n]
      local response = Keystore.get({key = id})
      response_text = response_text..id..'\r\n'
      --response_text = response_text..'Data: '..to_json(response['value'])..'\r\n'
      -- print out each value on new line
      for key,val in pairs(from_json(response['value'])) do
        response_text = response_text.. '   '..key..':'.. val ..'\r\n'
      end
      n = n + 1
    end
  end
  return response_text
else
  local resp = Keystore.get({key = "identifier_" .. identifier})
  return 'Getting Key Value Raw Data for: Device Identifier: '..identifier..'\r\n'..to_json(resp)
end

--#ENDPOINT GET /development/storage/timeseries/{identifier}
-- Description: Show current time-series data for a specific unique device
-- Parameters: ?identifier=<uniqueidentifier>
local identifier = tostring(request.parameters.identifier)

if tostring ~= nil and tostring ~= "" then
  local data = {}
  -- Assumes temperature and humidity data device resources
  out = Timeseries.query({
    epoch='ms',
    q = "SELECT value FROM temperature,humidity WHERE identifier = '" ..identifier.."' LIMIT 20"})
  data['timeseries'] = out

  return 'Getting Last 20 Time Series Raw Data Points for: '..identifier..'\r\n'..to_json(out)
else
  response.message = "Conflict - Identifier Incorrect"
  response.code = 404
  return
end


--#ENDPOINT GET /development/device/data/{identifier}/{window}
-- Description: Get timeseries data for specific device
-- Parameters: ?identifier=<uniqueidentifier>&window=<number>
local identifier = tostring(request.parameters.identifier) -- ?identifier=<uniqueidentifier>
local window = tostring(request.parameters.window) -- in minutes,if ?window=<number>
if true then
  local data = {}
  if window == nil then window = '30' end
  -- Assumes temperature and humidity data device resources
  out = Timeseries.query({
    epoch='ms',
    q = "SELECT value FROM temperature,humidity WHERE identifier = '" ..identifier.."' AND time > now() - "..window.."m LIMIT 5000"})
  data['timeseries'] = out
  return data
else
  response.message = "Conflict - Identifier Incorrect"
  response.code = 404
  return
end
