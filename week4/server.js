require("dotenv").config()
const http = require("http")
const AppDataSource = require("./db")
const error500= require('./error500');

function isUndefined (value) {
  return value === undefined
}

function isNotValidString (value) {
  return typeof value !== "string" || value.trim().length === 0 || value === ""
}

function isNotValidInteger (value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0
}

function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json"
  }
  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const packages = await AppDataSource.getRepository("CreditPackageA").find({
        select: ["id", "name", "credit_amount", "price"]
      })
      res.writeHead(200, headers)
      //資料顯示在網站上
      res.write(JSON.stringify({ 
        status: "success",
        data: packages
      }))
      res.end()
    } catch (error) {
      error500(res);
    }
    
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body)

        //檢查欄位是否填寫正確，填寫錯誤則回傳400錯誤訊息
        if (isUndefined(data.name) || isNotValidString(data.name) ||
                isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount) ||
                isUndefined(data.price) || isNotValidInteger(data.price)) {
          res.writeHead(400, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "欄位未填寫正確"
          }))
          res.end()
          return
        }
        //檢查資料是否重複
        const creditPackageRepo = await AppDataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
          where: {
            name: data.name
          }
        })
        //資料重複，則回傳409錯誤訊息
        if (existPackage.length > 0) {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "資料重複"
          }))
          res.end()
          return
        }
        //新增資料
        const newPackage = await creditPackageRepo.create({
          name: data.name,
          credit_amount: data.credit_amount,
          price: data.price
        })
        //存入資料庫
        const result = await creditPackageRepo.save(newPackage)

        //成功後，回傳資料並顯示在網站上
        res.writeHead(200, headers)
        res.write(JSON.stringify({
          status: "success",
          data: result
        }))
        res.end()
      } catch (error) {
        error500(res);
      }
    })
  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
  
    try {
      //取得url特定ID
      const packageId = req.url.split("/").pop()
      
      if (!isValidUUID(skillId)) {
        res.writeHead(400, headers);
        res.write(JSON.stringify({
            status: "failed",
            message: "ID格式錯誤，應為 UUID"
        }));
        res.end();
        return;
    }
      
      //檢查ID是否填寫正確，填寫錯誤則回傳400錯誤訊息

      if (isUndefined(packageId) || isNotValidString(packageId)) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      //刪除資料
      const result = await AppDataSource.getRepository("CreditPackage").delete(packageId)
      //是否成功刪除，若無則回傳400錯誤訊息
      if (result.affected === 0) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      res.writeHead(200, headers)
      res.write(JSON.stringify({
        status: "success"
      }))
      res.end()
    } catch (error) {
      error500(res);
    }
  
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name"]
      });
      res.writeHead(200, headers)
      res.write(JSON.stringify({
        status: "success",
        data: data
      }))
      res.end()
      return
    } catch (error) {
      error500(res);
      
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        //檢查欄位是否填寫正確，填寫錯誤則回傳400錯誤訊息
        if (isUndefined(data.name) || isNotValidString(data.name) ) {
          res.writeHead(400, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "欄位未填寫正確"
          }))
          res.end()
          return
        }

        const skillRepo = await AppDataSource.getRepository("Skill");
        const existSkill = await skillRepo.find({
          where: {
            name: data.name
          }
        })

        if (existSkill.length > 0) {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "資料重複"
          }))
          res.end()
          return
        }

        const newSkill = await skillRepo.create({ name: data.name});
        const result = await skillRepo.save(newSkill);


        res.writeHead(200, headers)
        res.write(JSON.stringify({
        status: "success",
        data: data
      }))
      res.end()
      } catch (error) {
        error500(res);
      }
    })
  } else if (req.url.startsWith("/api/coaches/skill/") && req.method === "DELETE") {
    try {
      const skillId = req.url.split("/").pop();
      
      if (!isValidUUID(skillId)) {
        res.writeHead(400, headers);
        res.write(JSON.stringify({
            status: "failed",
            message: "ID格式錯誤，應為 UUID"
        }));
        res.end();
        return;
    }

      if (isUndefined(skillId) || isNotValidString(skillId)) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
       
      const result = await AppDataSource.getRepository("Skill").delete(skillId);
      console.log(result);
      if (result.affected == 0) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }

      res.writeHead(200, headers)
      res.write(JSON.stringify({
        status: "success"
      }))
      res.end()
      return
    } catch (error) {
      error500(res);  
    }
     
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers)
    res.end()
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      status: "failed",
      message: "無此網站路由",
    }))
    res.end()
  }
}

const server = http.createServer(requestListener)

async function startServer() {
  await AppDataSource.initialize()
  console.log("資料庫連接成功")
  server.listen(process.env.PORT)
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`)
  return server;
}

module.exports = startServer();
