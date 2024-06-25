import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'
import { afterEach } from 'node:test'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('User should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1800,
        type: 'credit'
      })
      .expect(201)
  })

  test('User should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1800,
        type: 'credit'
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    expect(cookies).not.toBeNull()

    const transactionListResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies!)
      .expect(200)

    expect(transactionListResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 1800,
      })
    ])
  })

  test('User should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1800,
        type: 'credit'
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    expect(cookies).not.toBeNull()

    const transactionListResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies!)

    const transactionId = transactionListResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies!)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 1800,
      })
    )
  })

  test('User should be able to get summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1800,
        type: 'credit'
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    expect(cookies).not.toBeNull()

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies!)
      .send({
        title: 'Debit transaction',
        amount: 900,
        type: 'debit'
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies!)

    expect(summaryResponse.body.summary).toEqual({
      amount: 900,
    })
  })

})
