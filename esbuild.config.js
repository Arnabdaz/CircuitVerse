const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const rails = require('esbuild-rails');
const sassPlugin = require('esbuild-plugin-sass');
const { execSync } = require('child_process');

const watchDirectories = [
    './app/javascript/**/*.js',
    './app/views/**/*.html.erb',
    './app/assets/stylesheets/**/*',
];

const watch = process.argv.includes('--watch');
const buildVueSimulator = process.env.BUILD_VUE === 'true';
const isDockerEnvironment = process.env.IS_DOCKER_ENVIRONMENT === 'true';

const watchPlugin = {
    name: 'watchPlugin',
    setup(build) {
        build.onStart(() => {
            // eslint-disable-next-line no-console
            console.log(`Build starting: ${new Date(Date.now()).toLocaleString()}`);
        });
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

function updateGitSubmodule() {
    execSync('git submodule update --init --remote', { cwd: process.cwd() });
}

function validatePackageJsonAndLock() {
    const packageJsonPath = path.join(process.cwd(), 'cv-frontend-vue', 'package.json');
    const packageLockJsonPath = path.join(process.cwd(), 'cv-frontend-vue', 'package-lock.json');

    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(packageLockJsonPath)) {
        throw new Error('package.json or package-lock.json is not found inside submodule directory');
    }
}

function installAndBuildPackage() {
    const vueDir = path.join(process.cwd(), 'cv-frontend-vue');
    execSync('npm install', { cwd: vueDir });
    execSync(watch ? 'npm run build -- --watch' : 'npm run build', { cwd: vueDir });
}

function logErrorAndExit(err) {
    // eslint-disable-next-line no-console
    console.error(`Error building Vue simulator: ${new Date(Date.now()).toLocaleString()}\n\n${err}`);
    process.exit(1);
}

async function buildVue() {
    try {
        if (!isDockerEnvironment) {
            updateGitSubmodule();
        }
        validatePackageJsonAndLock();
        installAndBuildPackage();
    } catch (err) {
        logErrorAndExit(err);
    }
}

const vuePlugin = {
    name: 'vuePlugin',
    setup(build) {
        build.onStart(() => {
            if (buildVueSimulator) {
                // eslint-disable-next-line no-console
                console.log(`Building Vue site: ${new Date(Date.now()).toLocaleString()}`);
            }
        });
    },
};

async function run() {
    const context = await esbuild.context({
        entryPoints: ['application.js', 'testbench.js'],
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
        await context.watch();
    } else {
        await context.rebuild();
        context.dispose();
    }
}

if (buildVueSimulator) {
    buildVue();
}
run().catch(() => {
    process.exit(1);
});
