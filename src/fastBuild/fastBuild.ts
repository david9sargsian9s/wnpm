import axios from 'axios';
import * as tar from 'tar-stream';
import zlib from 'zlib';

export interface IFastBuildFile {
  path: string;
  content: Buffer;
}

export class FastBuildEngine {
  /**
   * Downloads an npm package tarball directly into memory (RAM)
   * and unpacks all internal file contents.
   */
  public static async fetchAndExtract(
    packageName: string,
    version: string = 'latest'
  ): Promise<IFastBuildFile[]> {
    try {
      // 1. Fetch package metadata from official registry
      const registryUrl = `https://registry.npmjs.org/${packageName}/${version}`;
      const metaResponse = await axios.get(registryUrl, { timeout: 10000 });
      const tarballUrl = metaResponse.data.dist?.tarball;

      if (!tarballUrl) {
        throw new Error(`Tarball URL not found for package "${packageName}"`);
      }

      // 2. Download the compressed .tgz archive into RAM Buffer
      const tarballResponse = await axios.get<ArrayBuffer>(tarballUrl, {
        responseType: 'arraybuffer',
        timeout: 15000
      });
      const tarballBuffer = Buffer.from(tarballResponse.data);

      // 3. Decompress gzip and parse tar entries asynchronously
      return await this.unpackTarball(tarballBuffer);
    } catch (error: any) {
      throw new Error(`[FastBuild Engine Error]: ${error.message || error}`);
    }
  }

  /**
   * Safely unpacks tar.gz buffer in memory without leaving unhandled stream states
   */
  private static unpackTarball(compressedBuffer: Buffer): Promise<IFastBuildFile[]> {
    return new Promise((resolve, reject) => {
      const extractedFiles: IFastBuildFile[] = [];
      const extract = tar.extract();
      const gunzip = zlib.createGunzip();

      // Handle stream errors
      gunzip.on('error', (err) => reject(new Error(`Gzip decompression failed: ${err.message}`)));
      extract.on('error', (err) => reject(new Error(`Tar extraction failed: ${err.message}`)));

      extract.on('entry', (header, stream, next) => {
        // Strip the root "package/" prefix added by npm registry archives
        const relativePath = header.name.replace(/^package\//, '');

        // Ignore directories, empty entries, or non-regular files
        if (!relativePath || header.type === 'directory') {
          stream.resume();
          return next();
        }

        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          extractedFiles.push({
            path: relativePath,
            content: Buffer.concat(chunks)
          });
          next();
        });

        stream.on('error', (err) => {
          reject(err);
        });

        stream.resume();
      });

      extract.on('finish', () => {
        resolve(extractedFiles);
      });

      // Pipeline execution
      gunzip.pipe(extract);
      gunzip.end(compressedBuffer);
    });
  }
}