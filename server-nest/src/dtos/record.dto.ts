import { parse } from 'path'
import { IRecordUserMetadata } from 'src/common/IRecordUserMetadata'

export class RecordDTO {
  readonly key: string
  readonly eTag: string
  readonly size: number
  readonly contentType: string
  private userMetadata: Partial<IRecordUserMetadata>

  constructor(record: Partial<RecordDTO>) {
    Object.assign(this, record)
  }

  public set assetId(assetId: number) {
    this.userMetadata['X-Amz-Meta-Asset-Id'] = assetId
  }

  public get assetId(): number {
    return this.userMetadata['X-Amz-Meta-Asset-Id']
  }

  public get fileExtension(): string {
    return this.userMetadata['X-Amz-Meta-File-Extension']
  }

  public set fileExtension(ext: string) {
    this.userMetadata['X-Amz-Meta-File-Extension'] = ext
  }

  public get uploadType(): string {
    return this.userMetadata['X-Amz-Meta-Upload-Type']
  }

  public get userId(): number {
    return this.userMetadata['X-Amz-Meta-User-Id']
  }

  public get fileName(): string {
    return this.userMetadata['X-Amz-Meta-File-Name']
  }

  public set fileName(name: string) {
    this.userMetadata['X-Amz-Meta-File-Name'] = name
  }

  public set fileDimension(dimension: number) {
    this.userMetadata['X-Amz-Meta-File-Size'] = dimension
  }

  public get fileDimension(): number {
    return Number(this.userMetadata['X-Amz-Meta-File-Size'])
  }

  public get metaData(): Partial<IRecordUserMetadata> {
    return this.userMetadata
  }

  public get buildFileName(): string {
    return `${parse(this.key).name}_${this.fileDimension}.${this.fileExtension}`
  }
}