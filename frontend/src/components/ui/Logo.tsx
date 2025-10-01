export const Logo = () => {
    return (
        <div className="flex items-center justify-center p-4">
            <img
                src="/logo.svg"
                alt="Flowuni Logo"
                className="h-14 w-14 mr-3"
            />
            <div className="text-3xl font-bold text-[#644CEA]">Flowuni</div>
        </div>
    );
};
