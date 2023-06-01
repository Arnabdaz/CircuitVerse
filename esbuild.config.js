const path = require('path');
const esbuild = require('esbuild');
const rails = require('esbuild-rails');
const sassPlugin = require('esbuild-plugin-sass');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

const watchDirectories = [
    './app/javascript/**/*.js',
    './app/views/**/*.html.erb',
    './app/assets/stylesheets/**/*',
    './cv-frontend-vue/**/*',
];

const watch = process.argv.includes('--watch');

const watchPlugin = {
    name: 'watchPlugin',
    setup(build) {
        // eslint-disable-next-line no-console
        console.log(`Build starting: ${new Date(Date.now()).toLocaleString()}`);
        build.onEnd((result) => {
            if (result.errors.length > 0) {
                // eslint-disable-next-line no-console
                console.error(`Build finished, with errors: ${new Date(Date.now()).toLocaleString()}`);
            } else {
                // eslint-disable-next-line no-console
                console.log(`Build finished successfully: ${new Date(Date.now()).toLocaleString()}`);
            }
        });
    },
};

async function buildVue() {
    execSync('git submodule update --init --remote', { cwd: process.cwd() });
    execSync('npm install', { cwd: path.join(process.cwd(), 'cv-frontend-vue') });
    execSync('npm run build', { cwd: path.join(process.cwd(), 'cv-frontend-vue') });
}

const vuePlugin = {
    name: 'vuePlugin',
    setup(build) {
        build.onStart(() => {
            console.log(`Building Vue site: ${new Date(Date.now()).toLocaleString()}`);
        });
    },
};

async function run() {
    const context = await esbuild.context({
        entryPoints: ['application.js', 'simulator.js', 'testbench.js'],
        bundle: true,
        outdir: path.join(process.cwd(), 'app/assets/builds'),
        absWorkingDir: path.join(process.cwd(), 'app/javascript'),
        sourcemap: 'inline',
        loader: {
            '.png': 'file', '.svg': 'file', '.ttf': 'file', '.woff': 'file', '.woff2': 'file', '.eot': 'file',
        },
        plugins: [rails(), sassPlugin(), vuePlugin, watchPlugin],
    });

    if (watch) {
        const watcher = chokidar.watch('./cv-frontend-vue', { ignoreInitial: true });
        watcher.on('all', (event) => {
            if (event === 'change') {
                execSync('npm run build', { cwd: path.join(process.cwd(), 'cv-frontend-vue') });
            }
        });
        await context.watch();
    } else {
        await context.rebuild();
        context.dispose();
    }
}

run().catch(() => {
    process.exit(1);
});
