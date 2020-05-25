import cleaner from 'rollup-plugin-cleaner';
import multiInput from 'rollup-plugin-multi-input';
import copy from 'rollup-plugin-copy';
import babel from '@rollup/plugin-babel';

export default {
    input: [
        'src/index.js',
        'src/view/options.js',
        'src/view/add_torrent.js',
    ],
    output: {
        dir: 'dist/',
        format: 'esm',
    },
    plugins: [
        cleaner({ targets: ['./dist/'] }),
        multiInput(),
        babel({ babelHelpers: 'bundled' }),
        copy({
            targets: [
                {
                    src: [
                        'src/manifest.json',
                        'src/_locales/',
                        'src/icon/',
                    ],
                    dest: 'dist/'
                },
                {
                    src: 'src/view/*.html',
                    dest: 'dist/view/'
                },
            ]
        }),
    ],
}
