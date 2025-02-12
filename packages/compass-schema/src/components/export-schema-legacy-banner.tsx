import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import {
  ModalBody,
  ModalHeader,
  Modal,
  css,
  spacing,
  Badge,
  Button,
  Checkbox,
} from '@mongodb-js/compass-components';

import type { RootState, SchemaThunkDispatch } from '../stores/store';
import {
  confirmedLegacySchemaShare,
  switchToSchemaExport,
  SchemaExportActions,
  stopShowingLegacyBanner,
} from '../stores/schema-export-reducer';

const Image = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="214"
    height="183"
    viewBox="0 0 214 183"
    fill="none"
  >
    <g clipPath="url(#clip0_2746_46697)">
      <path
        d="M61.5278 139.425L104.349 121.335C110.154 118.885 119.056 118.859 124.24 121.278L192.934 153.349C198.118 155.769 197.615 159.717 191.811 162.166L148.989 180.256C143.184 182.706 134.283 182.732 129.099 180.313L60.4042 148.242C55.2201 145.823 55.7234 141.874 61.5278 139.425Z"
        fill="#FFF5F4"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M158.585 137.314L94.7534 164.277"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M173.161 144.12L109.33 171.083"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M144.009 130.508L80.1731 157.471"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M129.433 123.702L65.5969 150.665"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M187.741 150.921L123.906 177.889"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M175.755 168.951L174.627 156.464L139.302 158.423L140.53 144.941L97.825 150.014L97.1612 137.336L72.4946 134.791"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M175.837 171.208C178.667 171.11 180.926 170.018 180.883 168.769C180.84 167.52 178.511 166.587 175.681 166.685C172.85 166.783 170.591 167.875 170.634 169.124C170.677 170.373 173.006 171.306 175.837 171.208Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M175.805 170.305C177.505 170.246 178.863 169.59 178.837 168.84C178.811 168.089 177.412 167.529 175.712 167.588C174.011 167.646 172.654 168.302 172.68 169.053C172.706 169.803 174.105 170.364 175.805 170.305Z"
        fill="#0D427C"
      />
      <path
        d="M174.708 158.719C177.538 158.621 179.797 157.53 179.754 156.281C179.711 155.032 177.382 154.098 174.552 154.196C171.721 154.294 169.462 155.386 169.505 156.635C169.548 157.884 171.878 158.817 174.708 158.719Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M174.677 157.817C176.377 157.758 177.734 157.102 177.708 156.351C177.682 155.601 176.283 155.04 174.583 155.099C172.883 155.158 171.526 155.814 171.552 156.564C171.577 157.315 172.977 157.875 174.677 157.817Z"
        fill="#0D427C"
      />
      <path
        d="M139.773 160.518C142.603 160.42 144.863 159.328 144.82 158.079C144.777 156.83 142.447 155.897 139.617 155.994C136.787 156.092 134.527 157.184 134.571 158.433C134.614 159.682 136.943 160.615 139.773 160.518Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M139.742 159.615C141.442 159.556 142.799 158.9 142.773 158.149C142.748 157.399 141.348 156.839 139.648 156.897C137.948 156.956 136.591 157.612 136.617 158.363C136.643 159.113 138.042 159.673 139.742 159.615Z"
        fill="#0D427C"
      />
      <path
        d="M139.751 147.561C142.581 147.463 144.841 146.371 144.798 145.122C144.755 143.873 142.425 142.94 139.595 143.038C136.765 143.136 134.505 144.228 134.549 145.477C134.592 146.726 136.921 147.659 139.751 147.561Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M139.72 146.658C141.42 146.6 142.777 145.944 142.751 145.193C142.726 144.443 141.326 143.882 139.626 143.941C137.926 144 136.569 144.656 136.595 145.406C136.621 146.157 138.02 146.717 139.72 146.658Z"
        fill="#0D427C"
      />
      <path
        d="M97.9068 152.272C100.737 152.174 102.996 151.082 102.953 149.833C102.91 148.584 100.581 147.651 97.7506 147.749C94.9203 147.847 92.6609 148.939 92.7041 150.188C92.7472 151.437 95.0765 152.37 97.9068 152.272Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M97.8757 151.369C99.5757 151.31 100.933 150.654 100.907 149.904C100.881 149.154 99.4819 148.593 97.7819 148.652C96.0818 148.711 94.7246 149.367 94.7505 150.117C94.7764 150.868 96.1756 151.428 97.8757 151.369Z"
        fill="#0D427C"
      />
      <path
        d="M97.2442 139.594C100.074 139.496 102.334 138.404 102.291 137.155C102.248 135.906 99.9182 134.973 97.088 135.071C94.2577 135.169 91.9983 136.261 92.0415 137.51C92.0846 138.759 94.4139 139.692 97.2442 139.594Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M97.2128 138.691C98.9129 138.632 100.27 137.976 100.244 137.226C100.218 136.476 98.8191 135.915 97.119 135.974C95.4189 136.033 94.0618 136.689 94.0877 137.439C94.1136 138.189 95.5128 138.75 97.2128 138.691Z"
        fill="#0D427C"
      />
      <path
        d="M72.5738 137.052C75.404 136.954 77.6634 135.863 77.6203 134.614C77.5772 133.365 75.2478 132.431 72.4176 132.529C69.5873 132.627 67.3279 133.719 67.3711 134.968C67.4142 136.217 69.7435 137.15 72.5738 137.052Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72.5427 136.15C74.2427 136.091 75.5999 135.435 75.574 134.684C75.5481 133.934 74.1489 133.373 72.4488 133.432C70.7488 133.491 69.3916 134.147 69.4175 134.897C69.4434 135.648 70.8426 136.208 72.5427 136.15Z"
        fill="#0D427C"
      />
      <path
        d="M124.24 121.278C119.056 118.859 110.154 118.885 104.349 121.335L96.3152 124.731L152.446 150.939C157.63 153.358 166.532 153.332 172.337 150.882L180.371 147.486L124.24 121.278Z"
        fill="black"
      />
      <path
        d="M160.051 145.049L52.5347 94.8536C46.8734 92.2129 42.2837 85.472 42.2837 79.8083V6.75814C42.2837 1.09011 46.8734 -1.35952 52.5347 1.28122L160.047 51.4769C165.708 54.1176 170.298 60.8585 170.298 66.5221V139.572C170.298 145.24 165.708 147.69 160.047 145.049H160.051Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160.051 145.049L52.5347 94.8538C46.8734 92.213 42.2837 85.4722 42.2837 79.8085V13.7988L170.298 73.5628V139.573C170.298 145.241 165.708 147.69 160.047 145.049H160.051Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42.2881 13.7988L170.298 73.5628"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M121.524 64.3116L68.4818 39.5503C67.7747 39.2202 67.1934 38.3689 67.1934 37.661C67.1934 36.953 67.7703 36.6446 68.4818 36.9747L121.524 61.736C122.231 62.0661 122.813 62.9174 122.813 63.6253C122.813 64.3333 122.236 64.6417 121.524 64.3116Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160.116 82.3274L128.37 67.5037C127.663 67.1736 127.081 66.3223 127.081 65.6144C127.081 64.9064 127.658 64.598 128.37 64.9281L160.116 79.7518C160.823 80.0819 161.405 80.9332 161.405 81.6412C161.405 82.3491 160.828 82.6575 160.116 82.3274Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160.116 122.347L51.3983 71.5909C50.6912 71.2608 50.1099 70.4095 50.1099 69.7015C50.1099 68.9935 50.6868 68.6852 51.3983 69.0153L160.116 119.771C160.823 120.101 161.405 120.953 161.405 121.661C161.405 122.369 160.828 122.677 160.116 122.347Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M111.802 86.5232L51.3983 58.3221C50.6912 57.992 50.1099 57.1407 50.1099 56.4327C50.1099 55.7247 50.6868 55.4164 51.3983 55.7465L111.802 83.9476C112.51 84.2777 113.091 85.129 113.091 85.837C113.091 86.5449 112.514 86.8533 111.802 86.5232Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160.116 109.078L118.648 89.7156C117.941 89.3855 117.359 88.5342 117.359 87.8263C117.359 87.1183 117.936 86.8099 118.648 87.14L160.116 106.503C160.823 106.833 161.404 107.684 161.404 108.392C161.404 109.1 160.827 109.408 160.116 109.078Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M91.5433 61.0062L160.116 93.0208C160.823 93.3509 161.405 94.2022 161.405 94.9101C161.405 95.6181 160.828 95.9265 160.116 95.5964L91.5433 63.5818C90.8362 63.2517 90.2549 62.4004 90.2549 61.6925C90.2549 60.9845 90.8319 60.6761 91.5433 61.0062Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M51.3983 42.2648L84.6978 57.8095C85.4049 58.1396 85.9862 58.9909 85.9862 59.6988C85.9862 60.4068 85.4092 60.7152 84.6978 60.3851L51.3983 44.8404C50.6912 44.5103 50.1099 43.659 50.1099 42.951C50.1099 42.2431 50.6868 41.9347 51.3983 42.2648Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M91.5433 101.021L160.116 133.036C160.823 133.366 161.405 134.217 161.405 134.925C161.405 135.633 160.828 135.941 160.116 135.611L91.5433 103.597C90.8362 103.267 90.2549 102.415 90.2549 101.707C90.2549 100.999 90.8319 100.691 91.5433 101.021Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M51.3983 82.2797L84.6978 97.8244C85.4049 98.1545 85.9862 99.0058 85.9862 99.7137C85.9862 100.422 85.4092 100.73 84.6978 100.4L51.3983 84.8553C50.6912 84.5252 50.1099 83.6739 50.1099 82.9659C50.1099 82.258 50.6868 81.9496 51.3983 82.2797Z"
        fill="#B3FD34"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54.9568 12.9591C55.8069 12.2835 55.6279 10.6408 54.5569 9.28988C53.486 7.939 51.9286 7.39153 51.0785 8.06709C50.2284 8.74264 50.4075 10.3854 51.4784 11.7363C52.5494 13.0872 54.1067 13.6346 54.9568 12.9591Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M61.8196 16.1624C62.6697 15.4869 62.4907 13.8441 61.4197 12.4933C60.3488 11.1424 58.7914 10.5949 57.9413 11.2705C57.0912 11.946 57.2703 13.5888 58.3412 14.9396C59.4122 16.2905 60.9695 16.838 61.8196 16.1624Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M68.6795 19.3668C69.5296 18.6912 69.3505 17.0485 68.2796 15.6976C67.2086 14.3467 65.6513 13.7992 64.8012 14.4748C63.9511 15.1504 64.1301 16.7931 65.2011 18.144C66.2721 19.4949 67.8294 20.0423 68.6795 19.3668Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50.2573 32.3404L58.2959 32.8703L50.2573 25.8689V22.2856L63.2717 33.8085V36.5708L50.2573 35.928V32.3361V32.3404Z"
        fill="#00ED64"
      />
      <path
        d="M50.2573 32.3404L58.2959 32.8703L50.2573 25.8689V22.2856L63.2717 33.8085V36.5708L50.2573 35.928V32.3361V32.3404Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M107.477 131.151L36.0975 97.8289C29.4602 94.7321 24.0332 86.7578 24.0332 80.1125C24.0332 73.4673 29.4645 70.5659 36.0975 73.6671L107.477 106.989C114.114 110.086 119.541 118.06 119.541 124.705C119.541 131.351 114.11 134.252 107.477 131.151Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.5056 86.7926L39.2731 87.2399L32.5056 81.346V78.3318L43.4594 88.0304V90.3584L32.5056 89.8155V86.7926Z"
        fill="#00ED64"
      />
      <path
        d="M32.5056 86.7926L39.2731 87.2399L32.5056 81.346V78.3318L43.4594 88.0304V90.3584L32.5056 89.8155V86.7926Z"
        fill="#00D2FF"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47.1338 90.9011L110.418 120.444"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M83.6608 138.73L12.2811 105.408C5.64814 102.311 0.216797 94.3369 0.216797 87.6916C0.216797 81.0464 5.64814 78.145 12.2811 81.2462L83.6608 114.568C90.2981 117.665 95.7251 125.639 95.7251 132.284C95.7251 138.93 90.2937 141.831 83.6608 138.73Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.6936 94.3714L15.4611 94.8188L8.6936 88.9249V85.9106L19.6474 95.6093V97.9373L8.6936 97.3944V94.3714Z"
        fill="#00ED64"
      />
      <path
        d="M8.6936 94.3714L15.4611 94.8188L8.6936 88.9249V85.9106L19.6474 95.6093V97.9373L8.6936 97.3944V94.3714Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.3174 98.4761L86.602 128.024"
        stroke="black"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
      <path
        d="M206.339 101.121C206.339 101.121 207.493 102.567 211.124 99.666C214.759 96.7646 213.605 95.3183 213.605 95.3183L195.094 72.2466C195.094 72.2466 193.619 71.1999 190.375 73.7885C187.134 76.3771 187.824 78.0493 187.824 78.0493L206.335 101.121H206.339Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M213.61 95.3183L195.099 72.2466C195.099 72.2466 193.624 71.1999 190.379 73.7885C187.451 76.1252 187.733 77.7192 187.811 78.0059C191.038 75.439 192.509 76.4813 192.509 76.4813L211.02 99.553C211.02 99.553 211.054 99.6008 211.098 99.692C211.106 99.6833 211.115 99.679 211.124 99.6703C214.759 96.769 213.605 95.3227 213.605 95.3227L213.61 95.3183Z"
        fill="black"
      />
      <path
        d="M188.253 79.4827C188.253 79.4827 189.932 80.486 193.437 77.7714C196.942 75.0568 196.396 73.1762 196.396 73.1762L191.416 66.7307C191.416 66.7307 190.535 67.9686 187.615 70.2358C184.696 72.503 183.273 73.0415 183.273 73.0415L188.253 79.487V79.4827Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M148.941 23.5102C162.962 12.6519 183.121 15.2275 193.966 29.2651C204.812 43.3027 202.239 63.4861 188.218 74.3443C174.197 85.2026 154.038 82.627 143.193 68.5895C132.348 54.5519 134.92 34.3685 148.941 23.5102ZM145.852 66.5307C155.561 79.1003 173.612 81.4066 186.162 71.6819C198.717 61.9616 201.02 43.889 191.307 31.3238C181.598 18.7543 163.547 16.448 150.997 26.1726C138.443 35.893 136.139 53.9655 145.852 66.5307Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M148.477 20.4135C162.498 9.55523 182.657 12.1308 193.502 26.1684C204.348 40.206 201.775 60.3894 187.754 71.2477C173.733 82.1059 153.574 79.5304 142.729 65.4928C131.883 51.4552 134.456 31.2718 148.477 20.4135ZM145.388 63.434C155.097 76.0036 173.148 78.3099 185.698 68.5852C198.252 58.8649 200.556 40.7923 190.843 28.2271C181.134 15.6576 163.083 13.3513 150.533 23.076C137.978 32.7963 135.675 50.8688 145.388 63.434Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M148.477 20.4135C162.498 9.55523 182.657 12.1308 193.502 26.1684C204.348 40.206 201.775 60.3894 187.754 71.2477C173.733 82.1059 153.574 79.5304 142.729 65.4928C131.883 51.4552 134.456 31.2718 148.477 20.4135ZM145.388 63.434C155.097 76.0036 173.148 78.3099 185.698 68.5852C198.252 58.8649 200.556 40.7923 190.843 28.2271C181.134 15.6576 163.083 13.3513 150.533 23.076C137.978 32.7963 135.675 50.8688 145.388 63.434Z"
        fill="#00ED64"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M189.39 70.0663L194.626 76.8245C194.626 76.8245 196.804 74.718 196.43 73.1414L192.049 67.4907L189.39 70.0707V70.0663Z"
        fill="black"
      />
      <path
        d="M33.6118 42.4429V62.0443"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33.6118 9.3772V36.4317"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.9355 19.6145V55.9637"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35.82 146.982C38.8939 146.982 41.3858 144.487 41.3858 141.41C41.3858 138.332 38.8939 135.837 35.82 135.837C32.7461 135.837 30.2542 138.332 30.2542 141.41C30.2542 144.487 32.7461 146.982 35.82 146.982Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.6835 146.013C33.5772 146.622 34.653 146.982 35.8157 146.982C38.8914 146.982 41.3815 144.489 41.3815 141.41C41.3815 140.246 41.0258 139.164 40.4141 138.274C38.4489 141.401 35.8027 144.05 32.6792 146.018L32.6835 146.013Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M114.935 21.9294L119.772 26.7765L126.383 25.0044L128.157 18.3852L123.316 13.5381L116.705 15.3102L114.935 21.9294Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M128.157 18.3852L123.316 13.5381L121.546 20.1573L126.383 25.0044L128.157 18.3852Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M114.935 21.9293L121.546 20.1572"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M121.125 33.3003L120.058 37.2831L124.899 42.1303L131.511 40.3582L132.035 38.395L121.125 33.3003Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2746_46697">
        <rect width="214" height="182.328" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const imageContainerStyles = css({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: spacing[200],
});

const containerStyles = css({
  padding: spacing[600],
  width: '650px',
});

const checkboxContainerStyles = css({
  marginTop: spacing[300],
});

const comparisonContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: spacing[900],
  rowGap: spacing[400],
  alignItems: 'flex-start',
  justifyItems: 'flex-start',
  marginTop: spacing[600],
});

const optionHeaderStyles = css({
  fontSize: spacing[400],
  margin: '0px',
});

const ExportSchemaLegacyBanner: React.FunctionComponent<{
  isOpen: boolean;
  onClose: () => void;
  onLegacyShare: () => void;
  onSwitchToSchemaExport: () => void;
  stopShowingLegacyBanner: (choice: 'legacy' | 'export') => void;
}> = ({
  isOpen,
  onClose,
  onLegacyShare,
  onSwitchToSchemaExport,
  stopShowingLegacyBanner,
}) => {
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);
  const handleLegacyShare = useCallback(() => {
    if (dontShowAgainChecked) stopShowingLegacyBanner('legacy');
    onLegacyShare();
  }, [onLegacyShare, dontShowAgainChecked, stopShowingLegacyBanner]);
  const handleSwitchToNew = useCallback(() => {
    if (dontShowAgainChecked) stopShowingLegacyBanner('export');
    onSwitchToSchemaExport();
  }, [onSwitchToSchemaExport, dontShowAgainChecked, stopShowingLegacyBanner]);
  return (
    <Modal open={isOpen} setOpen={onClose} contentClassName={containerStyles}>
      <ModalHeader
        title={
          <>
            <div className={imageContainerStyles}>
              <Image />
            </div>
            New & Improved Export Schema Experience
          </>
        }
        subtitle={`
          Try the new Export Schema to generate your collection schema in multiple formats.
          The previous 'Share Schema' experience will not be receiving future updates moving forward.
          `}
      />
      <ModalBody>
        <div className={comparisonContainerStyles}>
          <Badge variant="yellow">Legacy</Badge>
          <Badge variant="green">New</Badge>
          <h4 className={optionHeaderStyles}>Share JSON Schema</h4>
          <h4 className={optionHeaderStyles}>Export JSON Schema</h4>
          <div>
            Non-standard schema format without customization capabilities.
          </div>
          <div>
            3 standardized schema formats designed for schema validation and
            analysis use cases.
          </div>
          <Button variant="default" size="small" onClick={handleLegacyShare}>
            Continue with legacy Share
          </Button>
          <Button variant="primary" size="small" onClick={handleSwitchToNew}>
            Try new Export
          </Button>
        </div>
        <div className={checkboxContainerStyles}>
          <Checkbox
            label="Do not show me this message again"
            checked={dontShowAgainChecked}
            onChange={(e) => setDontShowAgainChecked(e.currentTarget.checked)}
          />
        </div>
      </ModalBody>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isOpen: state.schemaExport.isLegacyBannerOpen,
  }),
  (dispatch: SchemaThunkDispatch) => ({
    onClose: () => dispatch({ type: SchemaExportActions.closeLegacyBanner }),
    onLegacyShare: () => dispatch(confirmedLegacySchemaShare()),
    onSwitchToSchemaExport: () => dispatch(switchToSchemaExport()),
    stopShowingLegacyBanner: (choice: 'legacy' | 'export') =>
      dispatch(stopShowingLegacyBanner(choice)),
  })
)(ExportSchemaLegacyBanner);
