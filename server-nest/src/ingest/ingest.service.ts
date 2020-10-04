import { Injectable } from '@nestjs/common'
import { KeycloakService } from '../keycloak/keycloak.service'
import { UserService } from '../users/user.service'
import { UserDTO } from '../dtos/user.dto'
import { AssetDTO } from '../dtos/asset.dto'
import { AssetService } from 'src/asset/asset.service'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { FileService } from 'src/file/file.service'
import { FileObjectDTO } from 'src/dtos/fileobject.dto'
import { FileDTO } from 'src/dtos/file.dto'

@Injectable()
export class IngestService {
  constructor (
    private readonly keycloakService: KeycloakService,
    private readonly userService: UserService,
    private readonly assetService: AssetService,
    private readonly fileService: FileService
  ) {}

  async ingestUsers (users: Array<Record<string, string>>): Promise<boolean> {
    for (const user of users) {
      console.log('Inegst user', user)

      const { givenName, familyName, displayFullName, emailPrimary } = user
      if (emailPrimary == null) continue
      try {
        // register a keycloak user
        const authServerId = await this.keycloakService.registerUser(emailPrimary, givenName, familyName)

        // register to hasura
        const userDTO: UserDTO = new UserDTO({
          authServerId,
          emailPrimary,
          givenName,
          displayFullName,
          familyName
        })

        let userDb = await this.userService.findUser(userDTO)

        if (userDb != null) continue

        userDb = await this.userService.createUser(userDTO)
      } catch (error) {
        console.log('Error during user ingest', error.message)
      }
    }
    return true
  }

  async ingestProjects (): Promise<boolean> {
    const data = readFileSync(resolve('../data/projects_ingest.json'), 'utf8')
    const projects = JSON.parse(data)
    if (projects == null) return false

    for (const project of projects) {
      const {
        name,
        createdBy,
        privacyType,
        assetType,
        folders
      } = project

      //   Find user id from email
      const user = await this.userService.findByEmail(createdBy)
      if (user == null) return

      //   Create a project asset
      const projectAsset = await this.assetService.insertAsset(new AssetDTO({
        createdById: user.id,
        name: name,
        assetType: assetType,
        privacyType: privacyType
      }))

      for (const folder of folders) {
        const folderAsset = await this.assetService.insertAsset(new AssetDTO({
          createdById: user.id,
          name: folder.name,
          assetType: folder.assetType,
          privacyType: folder.privacyType,
          parentId: projectAsset.id
        }))

        const { files } = folder
        if (files == null) continue

        for (const fi of files) {
          const fileAsset = await this.assetService.insertAsset(new AssetDTO({
            createdById: user.id,
            name: fi.name,
            assetType: fi.assetType,
            privacyType: fi.privacyType,
            parentId: folderAsset.id
          }))

          const { file } = fi

          const fileobjectsId = await this.fileService
            .insertFileObject(new FileObjectDTO({
              location: 's3://minio-1.nyu.edu/cas',
              size: file.fileobjects.size,
              sha1: file.fileobjects.sha1,
              sha256: file.fileobjects.sha256,
              md5: file.fileobjects.md5
            }))

          await this.fileService
            .insertFile(new FileDTO({
              name: file.name,
              assetId: fileAsset.id,
              fileFormatId: file.fileFormatId.length === 0 ? 'mp4' : file.fileFormatId,
              uploadedById: user.id,
              fileobjectId: fileobjectsId
            // createdDateTime: new Date().toISOString()
            }))
        }
      }
    }
    return true
  }
}