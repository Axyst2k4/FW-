import { Container } from 'typedi';
import LoggerInstance from './logger';
import mqtt from 'mqtt';
import config from '@/config';
import { Server as HttpServerInterface } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createRegistryStore } from './store';

export default ({
  mongoConnection,
  models,
  httpServer,
}: {
  mongoConnection;
  models: { name: string; model: any }[];
  httpServer: HttpServerInterface;
}) => {
  try {
    models.forEach(m => {
      Container.set(m.name, m.model);
    });

    const mqttClient = mqtt.connect(config.mqttURL, {
      clientId: 'MASTER_SVR',
      clean: false,
      username: 'admin',
      password: 'password',
    });
    const socketServer = new SocketServer(httpServer, {
      cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
      },
    });

    const store = createRegistryStore();
    store.persist.rehydrate();

    Container.set('logger', LoggerInstance);
    Container.set('mqttClient', mqttClient);
    Container.set('store', store);
    Container.set('io', socketServer);

    LoggerInstance.info('✌️ Agenda injected into container');

    return { mqtt: mqttClient, io: socketServer };
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
