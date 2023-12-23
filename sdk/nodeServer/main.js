const fs = require('fs')
const path = require('path')
const tmpPath = require('os').tmpdir()
const { cookieToJson } = require('../../corejs/util/index.js')
const apiIndex = require('../../corejs/util/api.js')
const api = require('../../corejs/index.js')
const { encodeURIComponent } = require('../../corejs/util/global_patch.js')

if (!fs.existsSync(path.resolve(tmpPath, 'anonymous_token'))) {
  fs.writeFileSync(path.resolve(tmpPath, 'anonymous_token'), '', 'utf-8')
}

let firstRun = true
/** @type {Record<string, any>} */
let obj = {}
const files = Object.keys(apiIndex)
files.forEach((file) => {
  let fileModule = apiIndex[file]
  let fn = file
  obj[fn] = function (data = {}) {
    if (typeof data.cookie === 'string') {
      data.cookie = cookieToJson(data.cookie)
    }
    return fileModule(
      {
        ...data,
        cookie: data.cookie ? data.cookie : {},
      },
      async (...args) => {
        if (firstRun) {
          firstRun = false
          const generateConfig = require('./generateConfig.js')
          await generateConfig()
        }
        // 待优化
        const request = require('./request.js')
        const get_request_param = require('../../corejs/util/request_param.js')
        let request_param = get_request_param(...args)
        console.log(request_param)
        let response = await request(request_param)
        console.log(response.data)

        let result = JSON.stringify({
          status: response.status,
          data: response.data,
          headers: response.headers,
        })

        console.log(result)

        return api.afterRequest(
          result,
          request_param.crypto,
          request_param.apiName,
        )
      },
    )
  }
})

/**
 * @type {Record<string, any> & import("./server.js")}
 */
module.exports = {
  ...require('./server.js'),
  ...obj,
}
