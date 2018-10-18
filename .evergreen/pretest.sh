if [ -n "$IS_LINUX" ]; then
    if [ -n "$IS_RHEL" ]; then
        sudo yum install -y xorg-X11-server-Xvfb
        # sudo yum install clang dbus-devel gtk3-devel libnotify-devel \
        #      libgnome-keyring-devel xorg-x11-server-utils libcap-devel \
        #      cups-devel libXtst-devel alsa-lib-devel libXrandr-devel \
        #      GConf2-devel nss-devel python-dbusmock
    elif [ -n "$IS_UBUNTU" ]; then
        sudo apt-get update
        sudo apt-get install -y x11-utils x11-xserver-utils xserver-xorg-core xvfb dbus-x11
    fi
    sudo cp $(pwd)/.evergreen/etc-init.d-xvfb /etc/init.d/xvfb
    sh -e /etc/init.d/xvfb start
    sleep 3
fi