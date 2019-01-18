const { saveData, init } = require('./index');
const influx = require('./influx');

jest.mock('./influx', () => {
    return {
        getDatabaseNames: jest.fn(),
        createDatabase: jest.fn(),
        writePoints: jest.fn()
    };
});

describe('influxdb', () => {
    beforeEach(() => {
        influx.getDatabaseNames.mockClear();
        influx.createDatabase.mockClear();
        influx.writePoints.mockClear();
    });

    describe('init', () => {
        it('gets the names of the databases and creates a `sentry-metrics` database if one does not already exist', async () => {
            influx.getDatabaseNames.mockResolvedValue(['database1', 'database2']);

            await init();

            expect(influx.createDatabase).toBeCalledWith('sentry-metrics');
        });

        it('gets the names of the databases and does not create a `sentry-metrics` database if one already exists', async () => {
            influx.getDatabaseNames.mockResolvedValue(['database1', 'sentry-metrics']);

            await init();

            expect(influx.createDatabase).not.toHaveBeenCalled();
        });

        it('rejects when failing to get database names from influx', async () => {
            influx.getDatabaseNames.mockRejectedValue();

            return expect(init()).rejects.toMatch('Failed to initialise influx');
        });
    });

    describe('saveData', () => {
        it('writes influxdb points into the database for each property on a given object if it has values', async () => {
            const result = await saveData('https://www.test.com', [{ measurement:'firstname',tags:{"url":'https://www.test.com'}, fields:{value: 1.000000000, total_visits: 1, sentry_events: 1}}, { measurement:'lastname',tags:{"url":'https://www.test.com'}, fields:{value: 1.000000000, total_visits: 1, sentry_events: 1}}]);

            expect(influx.writePoints).toHaveBeenCalledWith([
                {
                    measurement: 'firstname',
                    tags: {
                        url: 'https://www.test.com'
                    },
                    fields: {
                        value: 1.0000000000,
                        total_visits: 1,
                        sentry_events: 1
                    }
                },
                {
                    measurement: 'lastname',
                    tags: {
                        url: 'https://www.test.com'
                    },
                    fields: {
                        value: 1.0000000000,
                        total_visits: 1,
                        sentry_events: 1
                    }
                }
            ]);
        });

        it('rejects when writePoints fails to write into influxdb', async () => {
            influx.writePoints.mockRejectedValue();
            await expect(saveData('https://www.test.co.uk', { firstname: 'bob', lastname: undefined })).rejects.toEqual('Failed to save sentry data into influxdb for https://www.test.co.uk');
        });
    });
});
