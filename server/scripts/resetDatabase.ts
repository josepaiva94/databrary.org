import * as _ from 'lodash'
import pEachSeries from 'p-each-series'

import * as fs from 'fs'
import * as yaml from 'js-yaml'

import Knex from 'knex'
import knexConfig from '../knexfile'
import { Model } from 'objection'

import * as models from '../src/models'

interface ObjectSeed {
  model: string
  graph: any[]
}

interface TableSeed {
  table: string
  data: any[]
}

async function loadSeedTablesFromFile(knex:any, path: string) {
  const doc = yaml.safeLoad(
    fs.readFileSync(path, 'utf8')
  )

  await pEachSeries(doc, async (element: TableSeed) => {
    const tableName = element.table
    const data = element.data
    await knex(tableName).insert(data)
  })
}

async function loadSeedObjectsFromFile(path: string) {
  const doc = yaml.safeLoad(
    fs.readFileSync(path, 'utf8')
  )

  await pEachSeries(doc, async (element: ObjectSeed) => {
    const modelName = element.model
    const graph = element.graph
    await models[modelName]
      .query()
      .upsertGraph(graph, { relate: true })
  })
}

async function go () {
  const knex = Knex(knexConfig.development)
  Model.knex(knex)

  await knex.migrate.down()
  await knex.migrate.up()

  await loadSeedTablesFromFile(knex, 'seeds/tables.yaml')

  await knex.destroy()
}

// tslint:disable-next-line: no-floating-promises
go()