requrie('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path')
const { read } = require('./utils/FS');

const type = num => num == 1 ? 'Manager' : num == 2 ? 'Sotuvchi' : num == 3 ? 'Haydovchi' : num == 4 ? 'Qorovul' : false;
const PORT = process.env.PORT || 8000;

http.createServer((req,res) =>{
    const option = { "Content-type": "application/json" }
    const markets = read('markets.json');
    const products = read('products.json');
    const branches = read('branches.json');
    const workers = read('workers.json');
    if(req.method == 'GET') {
        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'markets'){
            res.writeHead(200, option)
            return res.end(JSON.stringify(markets))
        }

        if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'products'){
            const filter = products.filter(a => a.branch_id == req.url.split('/')[2]);

            if(filter.length <1){
                res.writeHead(404, option);
                return res.end('product not found');
            }
            res.writeHead(200, option);
            return res.end(JSON.stringify(filter))
        }

        if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'workers'){
            const filter = workers.filter(a => a.branch_id == req.url.split('/')[2]);

            if(filter.length <1){
                res.writeHead(404, option);
                return res.end('worker not found');
            }
            res.writeHead(200, option);
            return res.end(JSON.stringify(filter))
        }

        if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'markets'){
            const find = markets.filter(a => a.id == req.url.split('/')[2]);

           if(find.length <=0){
              res.writeHead(404, { "Content-type": "application/json" })
              return res.end(JSON.stringify("market not found"))
           }
  
        const result = () =>{
            let test = [];
            for(let i of find){
                i.branches = branches.filter(e => e.parent_id == i.id);
                test.push(i)
            }
            test[0].branches.map(a => delete a.parent_id);
            for(let i of test[0].branches){
                i.workers = workers.filter(e => e.branch_id == i.id);
            }

            for(let i of test[0].branches){
                i.products = products.filter(e => e.branch_id == i.id);
            }

            test[0].branches.map(a => a.workers.map(e => delete e.branch_id));
            test[0].branches.map(a => a.products.map(e => delete e.branch_id));

            return test
        }
           res.writeHead(200, option)
           return res.end(JSON.stringify(result()))
          }

    }

    if(req.method == 'POST') {
        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'markets'){
            req.on('data', chunk => {
                const { name } = JSON.parse(chunk)

                const test = markets.find(a => a.name.toLowerCase() == name.toLowerCase());

                if(test !== undefined){
                    res.writeHead(400, option);
                    return res.end(`${name} allaqachon mavjud`)
                }
    
                markets.push({  id: markets[markets.length - 1]?.id + 1 || 1, name})
    
                fs.writeFile(path.join(__dirname,'model', 'markets.json'), JSON.stringify(markets, null, 4), (err) => {
                    if(err) throw err
                   
                    res.writeHead(200, option)
                    return res.end('added!')
                })
            })
        }

        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'branches'){
            req.on('data', chunk => {
                const { name, address, parent_id } = JSON.parse(chunk)

                const test = branches.find(a => a.name.toLowerCase() == name.toLowerCase());

                if(test !== undefined){
                    res.writeHead(400, option);
                    return res.end(`${name} filiali avvaldan mavjud`)
                }

                const index = markets.findIndex(a => a.id == parent_id);
                if(index <0){
                  res.writeHead(404, option)
                  return res.end('not found')
                }
    
               branches.push({  id: branches[branches.length - 1]?.id + 1 || 1, name,address,parent_id})
    
                fs.writeFile(path.join(__dirname,'model', 'branches.json'), JSON.stringify(branches, null, 4), (err) => {
                    if(err) throw err
                   
                    res.writeHead(200, option)
                    return res.end('added!')
                })
            })
        }

        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'workers'){
            req.on('data', chunk => {
                const { name, position, branch_id } = JSON.parse(chunk) 

                const test = workers.find(a => a.name.toLowerCase() == name.toLowerCase());

                if(test !== undefined){
                    res.writeHead(400, option);
                    return res.end(`${name} ishchilaringiz safida bor`)
                }

                const index = branches.findIndex(a => a.id == branch_id);
                if(index <0 || type(position) == false){
                  res.writeHead(404, option)
                  return res.end('branch or position not found')
                }
    
                if(index >= 0 && type(position) !== false){
                    workers.push({  id: workers[workers.length - 1]?.id + 1 || 1, name,position: type(position),branch_id})
    
                    fs.writeFile(path.join(__dirname,'model', 'workers.json'), JSON.stringify(workers, null, 4), (err) => {
                        if(err) throw err
                    
                        res.writeHead(200, option)
                        return res.end('worker added!')
                    })
                }
            })
        }

        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'products'){
            req.on('data', chunk => {
                const { name, price,count, branch_id } = JSON.parse(chunk);

                // const find = products.findIndex(a => a.name.toLowerCase() == name.toLowerCase() && a.branch_id == branch_id);

                // if(find >=0){
                //     products[find].count = products[find].count + count;
                //     fs.writeFile(path.join(__dirname,'model', 'products.json'), JSON.stringify(products, null, 4), (err) => {
                //         if(err) throw err
                       
                //         res.writeHead(200, option)
                //         return res.end(`${name} mahsuloti bazada avvaldan mavjud edi biz uning shunchaki eski countiga siz kiritgan yangi countni qo'shib qo'ydik`)
                //     })
                //     return
                // }

                const index = branches.findIndex(a => a.id == branch_id);
                if(index <0){
                  res.writeHead(404, option)
                  return res.end('branch not found')
                }
    
               products.push({  id: products[products.length - 1]?.id + 1 || 1, name,price,count, branch_id})
    
                fs.writeFile(path.join(__dirname,'model', 'products.json'), JSON.stringify(products, null, 4), (err) => {
                    if(err) throw err
                   
                    res.writeHead(200, option)
                    return res.end('product added!')
                })
            })
        }
    }

    if(req.method == 'PUT') {
        if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'markets'){
            req.on('data', chunk => {
              const { name, id } = JSON.parse(chunk)
  
          const index = markets.findIndex(a => a.id == id);
          if(index <0){
            res.writeHead(404, option)
            return res.end('not found')
          }
          if(index >=0){
              markets[index].name = name
          }
          
              fs.writeFile(path.join(__dirname, 'model', 'markets.json'), JSON.stringify(markets, null, 4), (err) => {
                  if(err) throw err
                 
                  res.writeHead(200, { "Content-Type": "application/json" })
                 return res.end('market edited')
              })
          })
          }

          if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'branches'){  
            req.on('data', chunk => {
              const { name, address,id } = JSON.parse(chunk)
  
          const index = branches.findIndex(a => a.id == id);
          if(index <0){
            res.writeHead(404, option)
            return res.end('branch not found')
          }
          if(index >=0){
              branches[index].name = name ? name : branches[index]?.name,
              branches[index].address = address ? address : branches[index]?.address
          }
          
              fs.writeFile(path.join(__dirname, 'model', 'branches.json'), JSON.stringify(branches, null, 4), (err) => {
                  if(err) throw err
                 
                  res.writeHead(200, { "Content-Type": "application/json" })
                 return res.end('branche edited')
              })
          })
          }

          if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'workers'){
            req.on('data', chunk => {
              const { name, position,id } = JSON.parse(chunk)
  
          const index = workers.findIndex(a => a.id == id);
          if(index <0 || type(position ? position : '') == false){
            res.writeHead(404, option)
            return res.end('worker or position not found')
          }
          if(index >=0 && type(position ? position : '') !== false){
              workers[index].name = name ? name : workers[index]?.name,
              workers[index].position = position ? type(position) : workers[index]?.position
          }
          
              fs.writeFile(path.join(__dirname, 'model', 'workers.json'), JSON.stringify(workers, null, 4), (err) => {
                  if(err) throw err
                 
                  res.writeHead(200, { "Content-Type": "application/json" })
                 return res.end('worker edited')
              })
          })
          }

          if(req.url.split('/').length == 2 && req.url.split('/')[1] == 'products'){
            req.on('data', chunk => {
              const { name, price,count,id } = JSON.parse(chunk)
  
          const index = products.findIndex(a => a.id == id);
          if(index <0){
            res.writeHead(404, option)
            return res.end('product not found')
          }
          if(index >=0){
              products[index].name = name ? name : products[index]?.name,
              products[index].price = price ? price : products[index]?.price,
              products[index].count = count ? count : products[index]?.count
          }
          
              fs.writeFile(path.join(__dirname, 'model', 'products.json'), JSON.stringify(products, null, 4), (err) => {
                  if(err) throw err
                 
                  res.writeHead(200, { "Content-Type": "application/json" })
                 return res.end('product edited')
              })
          })
          }
    }

    if(req.method == 'DELETE') {
        if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'markets'){
            const find = markets.findIndex(a => a.id == req.url.split('/')[2]);
  
           if(find <0){
              res.writeHead(404, { "Content-type": "application/json" })
              return res.end(JSON.stringify("not found"))
           }
  
           markets.splice(find,1)
           fs.writeFile(path.join(__dirname,'model', 'markets.json'), JSON.stringify(markets, null, 4), (err) => {
              if(err) throw err
             
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end('deleted')
              return
          })
  
          }

          if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'branches'){
            const find = branches.findIndex(a => a.id == req.url.split('/')[2]);
  
           if(find <0){
              res.writeHead(404, { "Content-type": "application/json" })
              return res.end(JSON.stringify("branche not found"))
           }
  
           branches.splice(find,1)
           fs.writeFile(path.join(__dirname,'model', 'branches.json'), JSON.stringify(branches, null, 4), (err) => {
              if(err) throw err
             
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end('branche deleted')
              return
          })
  
          }

          if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'workers'){
            const find = workers.findIndex(a => a.id == req.url.split('/')[2]);
  
           if(find <0){
              res.writeHead(404, { "Content-type": "application/json" })
              return res.end(JSON.stringify("worker not found"))
           }
  
           workers.splice(find,1)
           fs.writeFile(path.join(__dirname,'model', 'workers.json'), JSON.stringify(workers, null, 4), (err) => {
              if(err) throw err
             
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end('worker deleted')
              return
          })
  
          }

          if(req.url.split('/').length == 3 && req.url.split('/')[1] == 'products'){
            const find = products.findIndex(a => a.id == req.url.split('/')[2]);
  
           if(find <0){
              res.writeHead(404, { "Content-type": "application/json" })
              return res.end(JSON.stringify("product not found"))
           }
  
           products.splice(find,1)
           fs.writeFile(path.join(__dirname,'model', 'products.json'), JSON.stringify(products, null, 4), (err) => {
              if(err) throw err
             
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end('product deleted')
              return
          })
  
          }
    }

  
})

.listen(PORT, console.log(PORT + ' portda server ishga tushdi'))