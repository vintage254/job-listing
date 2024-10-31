/* eslint-disable react/prop-types */
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { z } from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useForm } from "react-hook-form";
  import useFetch from "@/hooks/use-fetch";
  import { addNewCompany } from "@/api/apiCompanies";
  import { BarLoader } from "react-spinners";
  import { useEffect } from "react";
  
  const schema = z.object({
    name: z.string().min(1, { message: "Company name is required" }),
    logo: z.any().refine((file) => file?.length === 1, "Logo is required"),
  });
  
  const AddCompanyDrawer = ({ fetchCompanies }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm({
      resolver: zodResolver(schema),
    });
  
    const { loading, fn: fnAddCompany } = useFetch(addNewCompany);
  
    const onSubmit = async (data) => {
      await fnAddCompany({
        name: data.name,
        logo: data.logo[0],
      });
      reset();
      fetchCompanies();
    };
  
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Add Company</Button>
        </DrawerTrigger>
        <DrawerContent>
          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <DrawerHeader>
              <DrawerTitle>Add Company</DrawerTitle>
              <DrawerDescription>
                Add a new company to post jobs for.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input placeholder="Company Name" {...register("name")} />
              {errors.name && (
                <p className="text-red-500">{errors.name.message}</p>
              )}
              <Input type="file" {...register("logo")} />
              {errors.logo && (
                <p className="text-red-500">{errors.logo.message}</p>
              )}
            </div>
            <DrawerFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <BarLoader /> : "Add Company"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    );
  };
  
  export default AddCompanyDrawer;