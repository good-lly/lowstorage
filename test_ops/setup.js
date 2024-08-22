'use strict';
import { join, resolve } from 'path';
import { spawn } from 'child_process';

const CWD = resolve('.');
const composeFile = join(CWD, 'test_ops', 'compose.yaml');

const upAll = () => {
	return new Promise((resolve, reject) => {
		const dockerCompose = spawn('docker', ['compose', '-f', composeFile, 'up', '-d'], { cwd: CWD });

		dockerCompose.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});

		dockerCompose.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});

		dockerCompose.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Docker Compose exited with code ${code}`));
			}
		});
	});
};

export default async (globalConfig, projectConfig) => {
	try {
		console.log('Starting MinIO container...');
		await upAll();
		console.log('MinIO container started successfully.');
	} catch (err) {
		console.error('Failed to start MinIO container:', err);
		process.exit(1);
	}
};
