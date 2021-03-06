<template>
  <div class="row">
    <form @submit.prevent="save" @change="saved = false" class="col-xs-12 col-sm-12 col-md-8">
      <div class="q-mb-md">
        <div class="row">
          <div class="col-10 text-h4">Profile</div>
          <div class="col-2 text-right">
            <q-btn type="submit" color="primary" :loading="saving" :disabled="saved" label="save" >
              <template v-slot:loading>
                <q-spinner-facebook />
              </template>
            </q-btn>
          </div>
        </div>
      </div>
      <div class="row justify-between items-start">
        <q-input
          v-model.trim="profile.givenName"
          class="col-4"
          label="First/Given Name:"
          dense
          outlined
          :rules="[val => !!val || 'Field is required']"
        />

        <q-input
          v-model="profile.additionalName"
          class="col-3"
          label="Middle/Additional Name:"
          dense
          outlined
        />

        <q-input
          v-model.trim="profile.familyName"
          class="col-4"
          label="Last/Family Name:"
          dense
          outlined
          :rules="[val => !!val || 'Field is required']"
        />
      </div>

      <div class="row">
        <q-input
          v-model.trim="profile.displayFullName"
          class="col-6 q-my-sm"
          label="Display Name:"
          dense
          outlined
          clear-icon="update"
          @clear="buildDefaultDisplayName"
          clearable
          :rules="[val => !!val || 'Field is required']"
        />
        <p class="input-description col-6 q-px-md q-my-sm">
          This is how others on Databrary will see your name, you can edit this to your liking.
        </p>
      </div>

      <div class="row">
        <q-input
          v-model="citationName"
          class="col-6 q-my-sm"
          label="Citation Name:"
          dense
          outlined
          readonly
          :rules="[]"
        />

        <p class="input-description col-6 q-px-md q-my-sm">
          Citations are built automatically across Databrary using first, middle and last names.
        </p>
      </div>

      <div class="row">
        <q-input
          v-model="profile.orcid"
          class="col-6 q-my-sm"
          label="ORCID:"
          dense
          outlined
          mask="####-####-####-####"
          fill-mask="#"
          :rules="[]"
        />

        <p class="input-description col-6 q-px-md q-my-sm">
          Your unique 16-digit alphanumeric code that identifies scientific/academic constributors.
        </p>
      </div>

      <div class="row">
        <q-field
          stack-label
          label="Authorized affiliation:"
          class="col-6 q-my-sm"
          dense
          readonly
          outlined
          :rules="[]"
        >
          <template v-slot:control>
            <div style="font-style: italic;font-size: small" tabindex="0">
              No affiliation yet. Click <a href='/'>here</a> to apply.
            </div>
          </template>
        </q-field>

        <p class="input-description col-6 q-px-md q-my-sm">
          For access to restricted data, you must be authorized by an institution.
        </p>
      </div>

      <q-input
        v-model="profile.bio"
        outlined
        dense
        label="About me:"
        class="q-my-sm"
        type="textarea"
      />

      <div class="text-h6 q-py-md">URLs</div>
      <q-list class="list" bordered separator>
        <q-item class="item row" v-for="(url, index) in profile.urls" :key="url.uid" dense>
          <q-item-section class="col-2 label">
            <q-item-label class="q-mx-md">
              {{ url.label }}
            </q-item-label>
          </q-item-section>
          <q-item-section class="col-8">
            <div>
              {{ url.url }}
            </div>
          </q-item-section>
          <q-item-section right >
            <div class="text-right">
              <q-btn flat>
                <q-avatar size="28px" class="text-right text-red-5" icon="delete" @click="deleteUrl(index)"/>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <div class="q-pt-md">
        <b>Add new url:</b>
      </div>
      <div class="q-pt-md">
        <div class="row">
          <q-input
            v-model.trim="urlLabel"
            outlined
            dense
            label="label"
            class="col-2 q-pb-md"
            suffix=":"
          />
          <q-input
            v-model.trim="url"
            outlined
            dense
            label="url"
            class="col-10 q-pb-md"
          >
          <template v-slot:append>
            <q-btn flat>
              <q-avatar color="primary" size="24px" class="text-right" icon="add" @click="addUrl"/>
            </q-btn>
          </template>
          </q-input>
        </div>
      </div>
      <div class="text-right">
        <q-btn type="submit" color="primary" :loading="saving" :disabled="saved" label="save" >
          <template v-slot:loading>
            <q-spinner-facebook />
          </template>
        </q-btn>
      </div>
    </form>
    <div class="order-sm-first order-md-last col-xs-12 col-sm-12 col-md-4 q-pa-sm text-center">
      <div class="text-h5 q-my-sm">Profile picture</div>
      <!-- Add a spinner on avatar loading  -->
      <q-avatar size="100px">
        <q-img :src="avatar" spinner-color="primary"/>
      </q-avatar>
      <br>
      <div class="q-my-sm">
        <ImageUploader
          assetType="avatar"
          :assetName="`User ${this.userId} Avatar`"
          @upload-success="onUploadSuccess"
        />
        <q-btn
          flat
          class="avatar-uploader q-my-sm"
          color="primary"
          label="Change profile picture"
        />

        <q-toggle
          v-model="useGravatar"
          color="primary"
          label="Use Gravatar"
        />
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { gql } from '@apollo/client'
import { uid } from 'quasar'
import { sync, get, call } from 'vuex-pathify'

import ImageUploader from '../../components/upload/ImageUploader'

export default {
  name: 'SettingsProfile',
  data () {
    return {
      profile: {
        urls: [],
        bio: '',
        familyName: '',
        givenName: '',
        additionalName: '',
        displayFullName: ''
      },
      url: '',
      urlLabel: '',
      saving: false
    }
  },
  components: {
    ImageUploader
  },
  computed: {
    avatar: get('app/avatar'),
    userId: get('app/dbId'),
    saved: sync('profile/isSaved'),
    useGravatar: sync('app/useGravatar'),
    citationName: function () {
      return this.buildCitationName()
    }
  },
  async created () {
    this.getProfile()
  },
  watch: {
    useGravatar: async function (isGravatar) {
      await this.$apollo.mutate({
        mutation: gql`
          mutation updateuseGravatar ($userId: Int!, $useGravatar: Boolean!) {
            update_users(
              where: {id: {_eq: $userId}}, 
              _set: {useGravatar: $useGravatar}
            ) {
              returning {
                useGravatar
              }
            }
          }
        `,
        variables: {
          userId: this.userId,
          useGravatar: isGravatar
        }
      })
      this.updateAvatar(isGravatar)
    }
  },
  methods: {
    updateAvatar: call('app/updateAvatar'),
    syncSessionAsync: call('app/syncSessionAsync'),
    async onUploadSuccess () {
      const oldAvatar = this.avatar
      const refreshSession = setInterval(async () => {
        await this.syncSessionAsync()
        if (this.avatar !== oldAvatar) {
          clearInterval(refreshSession)
        }
      }, 500)
    },
    async getProfile () {
      const result = await this.$apollo.query({
        query: gql`
          query GetUserProfile($userId: Int!) {
            users(where: {id: {_eq: $userId}}) {
              bio
              displayFullName
              givenName
              familyName
              additionalName
              urls
              orcid
            }
          }
        `,
        fetchPolicy: 'no-cache', // Important to not cache this query
        variables: {
          userId: this.userId
        }
      })
      this.setProfile(JSON.parse(JSON.stringify(result.data.users[0])))
    },
    buildCitationName: function () {
      if (this.profile.familyName.length === 0 || this.profile.givenName.length === 0) {
        return ''
      }
      const citationFirstName = this.profile.givenName.charAt(0).toUpperCase()
      const citationMiddleName = this.profile.additionalName.charAt(0).toUpperCase()
      return `${this.profile.familyName}, ${citationFirstName}. ${this.profile.additionalName ? `${citationMiddleName}.` : ''}`
    },
    buildDefaultDisplayName: function () {
      this.profile.displayFullName = `${this.profile.givenName} ${this.profile.familyName}`
    },
    addUrl: function () {
      if (this.url.length > 0) {
        const index = _.findIndex(this.profile.urls, (url) => { return url.label.toLowerCase() === this.urlLabel.toLowerCase() })
        if (index < 0) {
          this.profile.urls.push({
            'uid': uid(),
            'label': this.urlLabel,
            'url': this.url
          })
        } else {
          this.profile.urls[index].url = this.url
        }

        this.url = ''
        this.urlLabel = ''
      }
    },
    deleteUrl: function (index) {
      this.profile.urls.splice(index, 1)
    },
    async save () {
      try {
        this.saving = true
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation SetUserProfile(
              $userId: Int!, 
              $familyName: String!, 
              $givenName: String!, 
              $additionalName: String!, 
              $bio: String,
              $displayFullName: String!, 
              $urls: jsonb,
              $orcid: String
            ) {
              update_users(
                where: {id: {_eq: $userId}}, 
                _set: {
                  familyName: $familyName, 
                  givenName: $givenName,
                  additionalName: $additionalName, 
                  bio: $bio,
                  displayFullName: $displayFullName,  
                  urls: $urls,
                  orcid: $orcid
                }
              ) {
                returning {
                  bio
                  displayFullName
                  givenName
                  familyName
                  additionalName
                  urls
                  orcid
                }
              }
            }
          `,
          variables: {
            userId: this.userId,
            familyName: this.profile.familyName,
            givenName: this.profile.givenName,
            additionalName: this.profile.additionalName,
            displayFullName: this.profile.displayFullName,
            bio: this.profile.bio,
            urls: _.isEmpty(this.profile.urls) ? null : this.profile.urls,
            orcid: this.profile.orcid
          }
        })
        this.setProfile(JSON.parse(JSON.stringify(result.data.update_users.returning[0])))
        this.saved = true
      } catch (error) {
        console.error(error)
      } finally {
        this.saving = false
      }
    },
    setProfile: function (newProfile) {
      this.profile.familyName = newProfile.familyName
      this.profile.givenName = newProfile.givenName
      this.profile.additionalName = newProfile.additionalName || ''
      this.profile.orcid = newProfile.orcid || ''
      this.profile.bio = newProfile.bio || ''
      this.profile.displayFullName = newProfile.displayFullName
      this.profile.urls = newProfile.urls || []
    }
  }
}
</script>
<style>
.input-description {
  font-size: 0.75rem;
  font-style: italic;
  color: gray;
}
.label {
  margin-left: 0%;
  padding-left: 0%;
  background: lightgrey
}
.item {
  margin-left: 0%;
  padding-left: 0%
}
</style>
